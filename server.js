"use strict";

const express = require("express");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const util = require("util");
const http = require("http");
const mp3Duration = require("mp3-duration");

const server = express();

server.use(express.static("public"));

const socketServer = http.Server(server);
const socketIo = require("socket.io");
const io = socketIo(socketServer);

io.on("connection", socket => {
  console.log("New connection" + socket.id + ", " + socket.conn.remoteAddress);
  io.to(socket.id).emit("update");
});

server.post("/getremoteplaylist", (req, res) => {
  console.log("--request received /getremoteplaylist");
  let string = DataBase.currentPlaylist.buildJsonFromSongItems();
  console.log("--Sending json response");
  res.send(string);
});

server.post("/uploadsong", (req, res) => {
  console.log("--request received /uploadsong");
  let form = new formidable.IncomingForm();
  console.log("----built form");
  form.parse(req, function(err, fields, files) {
    var oldpath = files.file.path;
    var newpath =
      __dirname +
      "/" +
      DataBase.currentPlaylist.songsPath +
      "/" +
      files.file.name;
    fs.rename(oldpath, newpath, function(err) {
      if (err) throw err;
      DataBase.initDb().then(response => {
        res.write(DataBase.currentPlaylist.json);
        res.end();
        io.emit("update");
      });
    });
  });
});

server.get("/deleteSong", async (req, res) => {
  let deleteFile = function(file) {
    return new Promise((resolve, reject) => {
      console.log("file", file);
      fs.stat(__dirname + "/public/source/" + file, function(err, stats) {
        //console.log(stats);//here we got all information of file in stats variable

        if (err) {
          reject(err);
          return console.error("err", err);
        }
        resolve();

        fs.unlink(__dirname + "/public/source/" + file, function(err) {
          if (err) {
            reject(err);
            return console.log("err", err);
          }
          console.log("----file deleted successfully");
          resolve();
        });
      });
    });
  };

  console.log("--request received /deleteSong");
  console.log(req.query.deleteCandidate);
  if (req.query.deleteCandidate.forEach) {
    const promises = req.query.deleteCandidate.map(deleteFile);
    try {
      await Promise.all(promises);
    } finally {
      DataBase.initDb().then(response => {
        res.write(DataBase.currentPlaylist.json);
        res.end();
        io.emit("update");
      });
    }
  } else {
    try {
      await deleteFile(req.query.deleteCandidate);
    } finally {
      DataBase.initDb().then(response => {
        res.write(DataBase.currentPlaylist.json);
        res.end();
        io.emit("update");
      });
    }
  }
});

socketServer.listen(8080);

console.log("Server start");

const DataBase = {
  filePath: __dirname,

  initDb: async function() {
    console.log("--Initializing program database");
    await this.currentPlaylist.populateSongItems();
    console.log("--Building json database");
    let jsonString = this.currentPlaylist.buildJsonFromSongItems();
    console.log("--Saving json database");
    this.currentPlaylist.writeFile(jsonString, "song_Db.json");
    console.log("--Init complete");
    io.emit("update");
  },

  currentPlaylist: {
    json: null,
    songsPath: "public/source",
    songItems: [],

    Song: function Song(filePath, duration, position) {
      this.filePath = filePath;
      (this.playtime = duration),
        (this.id = Math.floor(Math.random() * 10000 + 1));
      this.position = position;
    },

    populateSongItems: async function() {
      console.log("----Fetching local songs");
      let localSongs = this.findLocalSongs(this.songsPath);
      const promises = localSongs.map(this.getSongDuration);
      console.log("----Calculating local song-lengths");
      let data = await Promise.all(promises);
      console.log("----Building objects");
      this.songItems = [];
      localSongs.forEach((elem, i) => {
        let newSongObj = new this.Song(elem, data[i], this.songItems.length);
        this.songItems.push(newSongObj);
      });
    },

    findLocalSongs: function(startpath) {
      let localSongs = [];
      function fromDir(startPath, filter) {
        if (!fs.existsSync(startPath)) {
          console.log("no directory ", startpath);
          return;
        }
        let files = fs.readdirSync(startPath);
        for (let i = 0; i < files.length; i++) {
          let filename = path.join(startPath, files[i]);
          let stat = fs.lstatSync(filename);
          if (stat.isDirectory()) {
            fromDir(filename, filter);
          } else if (filename.indexOf(filter) >= 0) {
            localSongs.push(filename);
          }
        }
      }
      fromDir(startpath, "mp3");
      return localSongs;
    },

    buildJsonFromSongItems: function() {
      console.log("----Serializing objects");
      let jsonString = JSON.stringify(this.songItems);
      this.json = jsonString;
      return jsonString;
    },

    writeFile: function(
      file,
      filename = "default.txt",
      path = __dirname + "/public/source/"
    ) {
      let filePath = path + filename;
      console.log("----Saving file at: ", filePath);
      fs.writeFile(filePath, file, function(err) {
        if (err) {
          return console.log(err);
        }
        console.log("--File successfully saved.");
      });
    },

    getSongDuration: async function(filename) {
      return mp3Duration(filename);
    }
  }
};

DataBase.initDb();
