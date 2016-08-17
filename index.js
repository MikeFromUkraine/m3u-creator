#!/usr/bin/env node
'use strict';
const fs = require('fs'); 
const mm = require('musicmetadata'); // used to get mp3 metadata
const program = require('commander'); // used forsetting options

program.parse(process.argv);
console.log( 'args: %j', program.args);

let filePath = program.args[0];
mm(fs.createReadStream(filePath), { duration: true }, function(err, metadata){
	if(err) throw err;
	
	let info = {
		artist: metadata.artist[0],
		title: metadata.title,
		duration: Math.ceil(metadata.duration),
		path: filePath
	}

	let writeValue = `#EXTM3U\n#EXTINF:${info.duration},${info.artist} - ${info.title}\n${info.path}`;
	fs.writeFile('test.m3u', writeValue, function(err){
		if(err) {
			console.log('error')
			return;
		}

		console.log('file created');
	});
});