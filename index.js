#!/usr/bin/env node

const { log } = require("console");
const fs = require("fs");
const yargs = require("yargs");

const { argv } = yargs(process.argv);

async function readFiles(path) {
  try {
    const content = await fs.promises.readFile(path, 'utf8');
    return content.split("\n");
  } catch (error) {
    console.error("Error reading file", error);
    return [];
  }
}

async function countEndPoint(logContent) {
  let count = new Map();
  const regExp = /(GET|POST|PUT|DELETE) \/api\/(\w+)/s;
  for (const line of logContent) {
    const matches = line.match(regExp)
    if (matches) {
      const endPoint = matches[1];
      if (count.has(endPoint)) {
        count.set(endPoint, count.get(endPoint) + 1);
      } else {
        count.set(endPoint, 1);
      }
    }
  }
  return count;
}

function parseTimestamp(logLine) {
  const timestampPattern = /\[(\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2})/;
  const match = logLine.match(timestampPattern);
  if (match) {
    return match[1];
  }
  return null;
}

function countAPICallsPerMinute(logLines) {
  const apiCallPattern = /(GET|POST|PUT|DELETE) \/api\/(\w+)/s;
  const apiCallsPerMinute = new Map();

  for (const line of logLines) {
    const timestamp = parseTimestamp(line);
    if (timestamp) {
      const match = line.match(apiCallPattern);
      if (match) {
        const minute = timestamp.substring(0, 16);
        const endPoint = match[1];
        const count = apiCallsPerMinute.get(minute) || 0;
        apiCallsPerMinute.set(minute, endPoint, count + 1);
      }
    }
  }
  for (const [Time, callCount] of apiCallsPerMinute) {
    return Time, callCount, apiCallsPerMinute;
  }
}

function statusCount(logLines) {
  const statusRegExp = /" \d{3}/;
  const regExp = /(GET|POST|PUT|DELETE) \/api\/(\w+)/s;
  const apiCallsByStatus = new Map();
  for(const line of logLines) {
    const matches = line.match(statusRegExp);
    if (matches) {
      if (matches["input"].match(regExp)){
        const statusCode = matches[0].replace(/^"\s+|\s+$/gm,'')
        const count = apiCallsByStatus.get(statusCode) || 0;
        apiCallsByStatus.set(statusCode, count + 1);
      }
    }
  }
  return apiCallsByStatus;
}

async function main() {
const logLines = await readFiles(argv.path);
  switch (argv.method){
    case 'countendpoint':
      const endpointCall = countEndPoint(logLines);
      console.log(endpointCall);
      break;
    case 'statuscode': 
      const status = statusCount(logLines);
      console.table(status);
      break;
    case 'apipermin': 
      const callPerMin = countAPICallsPerMinute(logLines);
      console.table(callPerMin);
      break;
  }
}

main();
