const fs = require('fs');
const crypto = require('crypto');

const SECRET_SALT = fs.readFileSync('salt.secret');
const HW_DIRS = [
    'C:\\Users\\ColeNelson\\Desktop\\cs782-research\\submissions\\hw1',
    'C:\\Users\\ColeNelson\\Desktop\\cs782-research\\submissions\\hw2',
    'C:\\Users\\ColeNelson\\Desktop\\cs782-research\\submissions\\hw3',
    'C:\\Users\\ColeNelson\\Desktop\\cs782-research\\submissions\\hw4',
    'C:\\Users\\ColeNelson\\Desktop\\cs782-research\\submissions\\hw5',
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
pseudonyms = included.reduce((curr, next) => { return {
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
