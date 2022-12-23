#! /usr/bin/env node
const chalk = require('chalk')
const yargs = require("yargs");
const figlet = require('figlet');
const chokidar = require('chokidar');
const fs = require('fs');
const { kill } = require('process');

console.log(
    chalk.yellow(
        figlet.textSync('File System Watcher')
    )
);

const usage = chalk.keyword('violet')("\nUsage: fsw -d <directory>\n")
const options = yargs
    .usage(usage)
    .option("d", { alias: "directory", describe: "Directory to watch", type: "string", demandOption: true })
    .option("s", { alias: "stop", describe: "Use to stop watching", demandOption: false })
    .help(true)
    .version(false)
    .argv;

const argv = require('yargs/yargs')(process.argv.slice(2)).argv;


const pid = fs.readFileSync(require("os").homedir() + "/fsw/fswatcher.pid")
if (argv.s) {
    try {
        kill(pid, "SIGTERM");
        console.log("Stopped watching...")
    } catch (exception) {
        console.log("No monitoring process is running");
    }
    return;
}

const directory = argv.d || argv.directory

if (!fs.existsSync(require("os").homedir() + "/fsw"))
    fs.mkdir(require("os").homedir() + "/fsw", () => console.log("fsw dir created"));


const watcher = chokidar.watch(directory, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    ignored: /^(.pid)/,
    persistent: true,
    ignoreInitial: true,
    silent: true,
});


const logPath = require("os").homedir + "/fsw/log.txt"

fs.writeFileSync(logPath, "", (err) => {
    if (err)
        console.log(err)
    return;
})


watcher
    .on('add', path => fs.appendFile(logPath, `File ${path} has been added\n`, (err) => {
        if (err)
            console.log(err);
        return;
    }))
    .on('change', path => fs.appendFile(logPath, `File ${path} has been changed\n`, (err) => {
        if (err)
            console.log(err);
        return;
    }))
    .on('unlink', path => fs.appendFile(logPath, `File ${path} has been removed\n`, (err) => {
        if (err)
            console.log(err);
        return;
    }))
    .on('addDir', path => fs.appendFile(logPath, `Directory ${path} has been added\n`, (err) => {
        if (err)
            console.log(err);
        return;
    }))
    .on('unlinkDir', path => fs.appendFile(logPath, `Directory ${path} has been removed\n`, (err) => {
        if (err)
            console.log(err);
        return;
    }))

// Start the watcher
watcher.on('ready', () => {
    console.log(`Initial scan complete. Now watching ${directory} for changes...`);
});




var daemon = require("daemonize2").setup({
    main: "index.js",
    name: "fswatcher",
    pidfile: require("os").userInfo().homedir + "/fsw/fswatcher.pid",

});

daemon.start();

console.log(chalk.greenBright("Monitoring", directory, "started succesfully."))
console.log("To stop monitoring, run \"fsw -s\" o \"fsw --stop\" ")



