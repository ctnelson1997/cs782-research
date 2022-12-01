const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { exit } = require('process');

const READ_ONLY = false;

const SECRET_SALT = fs.readFileSync('salt.secret');

const HW_DIRS = [
    'C:\\Users\\ColeNelson\\Desktop\\cs782-research\\submissions\\hw3',
    'C:\\Users\\ColeNelson\\Desktop\\cs782-research\\submissions\\hw6',
]

const usernames = [];

HW_DIRS.forEach(hwDir => {
    fs.readdirSync(hwDir).forEach(dirName => {
        if (!usernames.includes(dirName)) {
            usernames.push(dirName);
        }
    })
})

const ommitted = [];
let included = usernames.slice();

usernames.forEach(username => {
    HW_DIRS.forEach(hwDir => {
        if (!fs.readdirSync(hwDir).includes(username) && !ommitted.includes(username)) {
            ommitted.push(username);
            included = included.filter(x => username !== x)
        }
    });
})

console.log(`${included.length} users were included.`);
console.log(`${ommitted.length} users were ommitted.`);
console.log();
console.log('Omitted users...');
ommitted.forEach(omit => console.log(omit));
console.log();
console.log('Included users...');
included.forEach(incl => console.log(incl));
console.log();

console.log("Generating pseudonyms for included participants...");
pseudonyms = included.reduce((curr, next) => {
    return {
        ...curr,
        [next]: crypto.createHmac("SHA256", SECRET_SALT)
            .update(next)
            .digest('hex')
    }
}, {});

fs.writeFileSync('pseudonyms.secret',
    Object.keys(pseudonyms)
        .map(ps => `${ps},${pseudonyms[ps]}`)
        .join('\n')
);

console.log("Pseudonyms generated!");

if (READ_ONLY) {
    console.log("User identification complete. READ_ONLY flag set to true; exiting...")
    exit(0);
}

console.log("Recursively copying submissions...");

// copyRecursiveSync('../submissions', '../anonymized_submissions');
copyRecursiveSync('../submissions/hw3', '../anonymized_submissions/hw3');
copyRecursiveSync('../submissions/hw6', '../anonymized_submissions/hw6');



console.log('Recursive copy complete!');

console.log('Anonymizing file names...');



fs.readdirSync('../anonymized_submissions').forEach(hwDir => {
    if (hwDir.includes("hw3") || hwDir.includes("hw6")) {
        console.log(`In ${hwDir}...`);
        fs.readdirSync(`../anonymized_submissions/${hwDir}`).forEach(sub => {
            if (ommitted.includes(sub)) {
                console.log(`Removing ommitted submission for ${sub}`);
                fs.rmdirSync(`../anonymized_submissions/${hwDir}/${sub}`, { recursive: true, force: true });
            } else if (included.includes(sub)) {
                console.log(`Anonymizing submission for ${sub}`);
                fs.renameSync(`../anonymized_submissions/${hwDir}/${sub}`,
                    `../anonymized_submissions/${hwDir}/${pseudonyms[sub]}`);
            } else {
                console.error(`Erroneous submission for ${sub}`);
                exit(1);
            }
        });
    }
})

console.log('File name anonymization complete!')

/**
 * https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
 * Look ma, it's cp -R.
 * @param {string} src  The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
function copyRecursiveSync(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursiveSync(path.join(src, childItemName),
                path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};
