#!/usr/bin/env node
// cli for generating m3u playlist from mp3 file paths
'use strict';
const fs = require('fs'); 
const Promise = require('promise');

const mm = require('musicmetadata'); // used to get mp3 metadata
// may use 'commander' at a later date
//const program = require('commander'); // used forsetting options
//program.parse(process.argv);

let filePath = process.argv[2];
let playlistName = process.argv[3];

// main process
ReadFile(filePath).then(GetMetadata, ErrorFunc).then(CreateFile, ErrorFunc);

// Read text file with mp3 file listings
function ReadFile(filePath) {
	let promise = new Promise((resolve, reject) => {

		// read the file and split the lines to be read one at a time
		fs.readFile(filePath, 'utf8', (err, data) => {
			if(err) {
				reject(err);
			};

			let lines = data.split('\n');
			resolve(lines);
		});	
	});
	
	return promise;
}

/*
	Get mp3 metadata
 */
function GetMetadata(validFiles) {
	var promise = new Promise((resolve, reject) => {
		// add each metadata item to an array for processing
		let metadata = [];
		let requests = validFiles.map((line) => {
			return new Promise((res, rej) => {
				// create read stream
				var readStream = fs.createReadStream(line);

				// handle invalid file names/directories
				readStream.on('error', function (err) {
					if(err.code === 'ENOENT')
						console.log(`Error - Unable to add a line; it may not exist:\n ${err.path}\n`);
					else {
						console.log(err);;
					}
				});

				// collect metadata about the mp3 file
				mm(readStream, { duration: true }, function(err, metadata){
					if(err) rej(err);
					
					// information needed for the M3U file
					let info = {
						artist: metadata.artist[0],
						title: metadata.title,
						duration: Math.ceil(metadata.duration),
						path: line
					};
					
					res(info);
				});
			});
			
		});
		Promise.all(requests).then((metadata) => resolve(metadata));
	});

	return promise;
}

class M3uEmitter extends EventEmitter {}



/*
	Create M3U file
 */
function CreateFile(metadata) {
	
	// create the file and add each EXTINF entry
	let playlistFinalName = playlistName + ".m3u";
	let finalValue = '#EXTM3U\n';
	metadata.forEach((info) => {
		finalValue += `#EXTINF:${info.duration},${info.artist} - ${info.title}\n${info.path}\n`;
	});

	// notify user finished
	fs.writeFile(playlistFinalName, finalValue, function(err){
		if(err) {
			console.error('error')
			return;
		}
		console.log('File Created!');
	});
}

/*
	Handle Errors
 */
function ErrorFunc(err) {
	if(err.code === 'ENOENT') {
		console.log('File doesn\'t exist: %s', line);
		console.error(err);	
	}
	console.error(err);
}
