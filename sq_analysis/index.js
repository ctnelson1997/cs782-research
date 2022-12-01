import fetch from 'node-fetch';
import fs from 'fs';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const FS_INIT_SQL = "C:/Users/ColeNelson/Desktop/cs782-research/sq_analysis/includes/init.sql"
const INIT_SQL = fs.readFileSync(FS_INIT_SQL).toString();

const INSERT_PROJECT_SQL = 'INSERT INTO SQ_Project(id, semester, hw, student) VALUES (?, ?, ?, ?)';
const INSERT_ISSUE_SQL = 'INSERT INTO SQ_Issue(id, project_id, debt, effort, message, rule, severity, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';


const SQ_TOKEN = Buffer.from(fs.readFileSync('sqtoken.secret').toString().trim().concat(':')).toString('base64');
const DEF_HEADERS = {
    "Authorization": `Basic ${SQ_TOKEN}`
};

let projects = [];
let projectMap = {};

// sq limited to 10k results
// https://stackoverflow.com/questions/69841502/can-return-only-the-first-10000-results-10500th-result-asked
async function collectPages(url, bodyField) {
    const resp = await fetch(url, { headers: DEF_HEADERS });
    if (resp.status !== 200) {
        throw new Error(`non-200 status code encountered: ${resp.status}`)
    }

    const data = await resp.json();

    const totalResults = data.paging.total;
    if (totalResults > 1e4) {
        throw new Error('SQ can only handle <10k results');
    }

    const pageSize = data.paging.pageSize;
    const numPages = Math.ceil(totalResults / pageSize);
    const pages = Array.from(Array(numPages + 1).keys()).slice(2,);
    const results = await Promise.all(pages.map(pageNum => collectPage(url, pageNum, bodyField)));
    return [data[bodyField], results.flat()].flat();
}

// https://stackoverflow.com/questions/33289726/combination-of-async-function-await-settimeout
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function collectPage(url, pnum, bodyField) {
    await timeout((pnum - 2) * 10); // avoid throttling
    let purl = url;
    if (url.includes('?')) {
        purl += `&p=${pnum}`
    } else {
        purl += `?p=${pnum}`
    }
    const resp = await fetch(purl, { headers: DEF_HEADERS });
    if (resp.status !== 200) {
        throw new Error(`non-200 status code encountered: ${resp.status}`)
    }
    const data = await resp.json();
    return data[bodyField];
}

function expandProject(p, k, v) {
    projectMap[p] = { ...projectMap[p], [k]: v }
}

async function extractData() {
    projects = await collectPages('http://localhost:9000/api/projects/search', 'components');
    projectMap = projects.reduce((p, c) => {
        p[c.key] = {}
        return p
    }, {})

    await Promise.all(projects.map(async (p) => {
        const issues = await collectPages(`http://localhost:9000/api/issues/search?resolved=false&componentKeys=${p.key}`, 'issues');
        expandProject(p.key, 'issues', issues);
    }))
}

async function saveData(db) {
    await Promise.all(projects.map(async (p) => {
        const params = p.name.split("_");

        // I screwed up HW3 analysis
        if (params.length === 2) {
            await db.run(INSERT_PROJECT_SQL,
                "f22_" + p.name,
                "f22",
                params[0],
                params[1]
            )
        } else {
            await db.run(INSERT_PROJECT_SQL,
                p.name,
                params[0],
                params[1],
                params[2]
            )
        }

    }));

    await Promise.all(projects.map(async (p) => {
        await Promise.all(projectMap[p.name].issues.map(async (issue) => {
            // I screwed up HW3 analysis
            let newName = p.name;
            if(p.name.split("_").length === 2) {
                newName = `f22_${p.name}`
            }
            await db.run(INSERT_ISSUE_SQL,
                issue.key,
                newName,
                issue.debt,
                issue.effort,
                issue.message,
                issue.rule,
                issue.severity,
                issue.type
            );
        }));
    }));
}

async function execute() {
    const init_stmts = INIT_SQL.replaceAll(/\t\r\n/g, ' ').split(';').filter(str => str.trim()).map(stmt => stmt + ";");
    const db = await open({
        filename: 'db.db',
        driver: sqlite3.Database
    });

    for (const stmt of init_stmts) {
        await db.run(stmt)
    }

    await extractData();
    await saveData(db);
    db.close();
}

execute();
