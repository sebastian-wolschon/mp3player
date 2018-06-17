$(document).ready(function() {

    'use strict'

    var MainApp = {

        body : document.querySelector('#content'),

        nowSeeking : false,

        addEventListeners : function(){
            let body = MainApp.body;

            let player = document.querySelector('audio');
            let progress = document.querySelector('progress')
            let playButton = document.querySelector('.play-button');
            let volume = document.querySelectorAll('.volume-control');
            let timer = document.querySelector('.timer-container');
            let seekerTimer = document.querySelector('.seeker-timer');

            $(body).on({
                dragstart : this.playlistObject.handleDraggables.handleDragStart,
                dragenter : this.playlistObject.handleDraggables.handleDragEnter,
                dragover : this.playlistObject.handleDraggables.handleDragOver,
                dragleave :this.playlistObject.handleDraggables.handleDragLeave,
                drop : this.playlistObject.handleDraggables.handleDrop,
                dragend : this.playlistObject.handleDraggables.handleDragEnd,
            }, '.playlist-song');

            $(body).on({
                dragenter : this.playlistObject.handleDraggables.handleDragEnter,
                dragover : this.playlistObject.handleDraggables.handleDragOver,
                dragleave :this.playlistObject.handleDraggables.handleDragLeave,
                drop : this.playlistObject.handleDraggables.handleDrop,
                dragend : this.playlistObject.handleDraggables.handleDragEnd,
            }, '.playlist-bottom');

            $(body).on('click', '.playlist-song', function(event){
                if(event.ctrlKey){
                    this.classList.toggle('selection');
                    return;
                }
                else if(event.shiftKey){
                    let selectables = Array.from(event.currentTarget.parentNode.children);
                    let selectablesLength = selectables.length;
                    
                    let getTargetIndex = function(event){
                        let index = 0;
                        let traverseTargets = function(target = event.currentTarget){
                            if(target.previousSibling){
                                index++
                                traverseTargets(target.previousSibling)
                                return;
                            }
                            return;
                        }
                        traverseTargets(event.currentTarget);
                        return index;                   
                    }

                    let targetIndex = getTargetIndex(event);

                    let getFirstSelectedIndex = function(){
                        let index = 0;
                        for (index = 0; index < selectablesLength; index++){
                            if (selectables[index].classList.contains('selection')) return index;
                        }
                        return -1;
                    }

                    let firstSelectedIndex = getFirstSelectedIndex();

                    if (firstSelectedIndex == -1) this.classList.add('selection');
                    else if(firstSelectedIndex < targetIndex){
                        for (let i = firstSelectedIndex; i <= targetIndex; i++){
                            selectables[i].classList.add('selection');
                        }
                    }
                    else{
                        for (let i = targetIndex; i < firstSelectedIndex; i++){
                            selectables[i].classList.add('selection');
                        }
                    }                    
                }
                else{
                Array.from(event.currentTarget.parentNode.children).forEach(elem => elem.classList.remove('selection'));
                this.classList.add('selection');
                }
            });

            $(document).on('keyup', function(event){

                if(event.keyCode == 46){
                    let getSelection = function(){
                        return Array.from(body.querySelectorAll('.selection'));
                    }
                    console.log('deleting');
                    
                    let selection = getSelection();
                    if(selection.length > 0){
                        MainApp.playerObject.playNext(player);
                        player.pause();
                        playButton.childNodes.forEach( elem => elem.classList.toggle('d-none'));
                        MainApp.playlistObject.currentPlaylist.deleteSong(selection);
                    }
                }
            });

            $(document).on('dblclick','.playlist-song', (event) =>{
                let target = event.currentTarget;
                MainApp.playerObject.initPlayer(target.querySelector('.position').innerHTML -1, true);
            })

            $(document).on('click','.play-button', () =>{
                if(player.paused){
                    player.play();

                    playButton.classList.toggle('play');
                    playButton.classList.toggle('pause');
                    playButton.childNodes.forEach( elem => elem.classList.toggle('d-none'));

                }
                else{
                    player.pause();
                    playButton.classList.toggle('play');
                    playButton.classList.toggle('pause');
                    playButton.childNodes.forEach( elem => elem.classList.toggle('d-none'));
                }
            });

            $(document).on('click','.volume-control', () =>{
                if(player.volume == 0)  player.volume =1;       
                else player.volume = 0;

                volume.forEach(elem => elem.classList.toggle('d-none'));
            });

            $(document).on('click','.stop-button', () =>{
                if(!player.paused)
                    playButton.childNodes.forEach( elem => elem.classList.toggle('d-none'));
                MainApp.playerObject.stop(player);
            });

            $(document).on('click','.next-button', () =>{
                if(player.paused)
                    playButton.childNodes.forEach( elem => elem.classList.toggle('d-none'));
                MainApp.playerObject.playNext(player);
            });

            $(document).on('click','.prev-button', () =>{
                if(player.paused)
                    playButton.childNodes.forEach( elem => elem.classList.toggle('d-none'));
                MainApp.playerObject.playPrev(player);
            });

            player.ontimeupdate = () =>{
                    if(!this.nowSeeking)
                        MainApp.playerObject.updateSeeker(player.currentTime / player.duration, player);

                    progress.style.width = player.currentTime / player.duration * 100 + '%';
                    timer.firstChild.innerHTML = MainApp.timeToSeconds(player.currentTime) + ' / ' + MainApp.timeToSeconds(player.duration);
            }

            player.addEventListener('ended', () =>{
                MainApp.playerObject.playNext(player);
            });

            let clickedPos = 0;
            let flag = false;
            let progressBar = document.querySelector('.progress');
            let progressWidth = progressBar.clientWidth;
            let progressBarPos = progressBar.getBoundingClientRect();

            $(document).on('mousedown', '.progress', (event) =>{
                let initialEvent = event;
                flag = true;
                trackSeeker(initialEvent);
                $(document).on('mousemove', 'body',  (event) =>{
                        if(flag){
                            trackSeeker(event)
                        }
                });
            
            }).on('mouseup mouseleave','.progress', () =>{
                if(flag){
                    flag = false;
                    releaseSeeker();
                }
            })
                function trackSeeker(event){
                    MainApp.nowSeeking = true;
                    clickedPos = event.originalEvent.x - progressBarPos.left;
                    MainApp.playerObject.updateSeeker(clickedPos / progressWidth, player);
                    seekerTimer.style.opacity = '1';
                }

                function releaseSeeker(){
                    MainApp.nowSeeking = false;
                    MainApp.playerObject.seek(player, clickedPos, progressWidth);
                    seekerTimer.style.opacity = '0';
                }
        },

        // creates new node of given type (default div) and class (default none).
        // multiple classes can be set by passing them as Array of String.
        getNewNode : function(nodeTag = 'div', nodeClass = ''){
            let newNode = document.createElement(nodeTag);
            if (nodeClass != ''){
                if(nodeClass.forEach){
                    nodeClass.forEach( elem =>{
                        newNode.classList.add(elem);
                    });
                    return newNode;
                }
                newNode.classList.add(nodeClass);
            }
            return newNode;
        },

        timeToSeconds : function (time){
            let date = new Date(null);
            if(!isNaN(time)){
                date.setSeconds(time);
            }
            else{
                date.setSeconds(0);
            }
              
            let timeObj = date.toISOString().substr(14,5);
            return timeObj;
        },

        playerObject : {
            
            activeIndex : 0,

            initPlayer : function(activeIndex = 0, doubleClick = false){
                let playButton = document.querySelector('.play-button')
                this.activeIndex = 0;
                if (activeIndex != 0)
                    this.activeIndex = activeIndex;
                let player = document.querySelector('audio');
                let playlist = MainApp.playlistObject.currentPlaylist.contents;
                let path = playlist[this.activeIndex].filePath.replace('public\\', "");

                playlist.forEach(elem => elem.node.classList.remove('playing'));
                playlist[this.activeIndex].node.classList.add('playing');
                playButton.firstChild.classList.remove('d-none');
                playButton.lastChild.classList.add('d-none');

                player.src = path;
                player.volume = 1.0;
                if(doubleClick){
                    player.play();
                    if (!player.paused){
                        playButton.firstChild.classList.add('d-none');
                        playButton.lastChild.classList.remove('d-none');
                    }
                }
            },

            playNext : function(player){
                let playlist = MainApp.playlistObject.currentPlaylist.contents;
                playlist[this.activeIndex].node.classList.remove('playing');

                if(this.activeIndex >= playlist.length -1)
                    this.activeIndex = 0;
                else
                    this.activeIndex = this.activeIndex + 1;

                playlist[this.activeIndex].node.classList.add('playing');
                let path = playlist[this.activeIndex].filePath.replace('public\\', "");
                
                player.currentTime = 0;
                player.src = path;
                player.play();
            },

            playPrev : function(player){
                let playlist = MainApp.playlistObject.currentPlaylist.contents;
                playlist[this.activeIndex].node.classList.remove('playing');

                if(this.activeIndex <= 0)
                    this.activeIndex = playlist.length -1;
                else
                    this.activeIndex = this.activeIndex - 1;  

                playlist[this.activeIndex].node.classList.add('playing');
                let path = playlist[this.activeIndex].filePath.replace('public\\', "");

                player.currentTime = 0;
                player.src= path;
                player.play();
            },

            stop : function (player){
                player.pause();
                player.currentTime = 0;
            },

            seek : function(player, position, width){
                let seekScale = position / width;
                player.currentTime = player.duration * seekScale;
            },

            renderPlayer : function() {
                let body = MainApp.body;

                body.appendChild(this.renderPlayerControls());
                let playerControls = body.querySelector('.player-controls');
                playerControls.appendChild(this.renderPlayerTime());
                playerControls.appendChild(this.renderPlayerProgress());  
            },

            renderPlayerControls : function(){
                let body = MainApp.body;
                let playerContainer = MainApp.getNewNode('div', 'player-container');    
                let playerControls = MainApp.getNewNode('div', 'player-controls');

                let buttons = this.getButtons(6);
                buttons.children[0].classList.add('play-button', 'play');
                buttons.children[0].innerHTML = '<i class="fas fa-play"></i><i class="fas fa-pause d-none"></i>';
                buttons.children[1].classList.add('prev-button');
                buttons.children[1].innerHTML = '<i class="fas fa-step-backward"></i>';
                buttons.children[2].classList.add('stop-button');
                buttons.children[2].innerHTML = '<i class="fas fa-stop"></i>';
                buttons.children[3].classList.add('next-button');
                buttons.children[3].innerHTML = '<i class="fas fa-step-forward"></i>';
                buttons.children[4].classList.add('mute-button','volume-control');
                buttons.children[4].innerHTML = '<i class="fas fa-volume-up"></i>';
                buttons.children[5].classList.add('unmute-button','volume-control','d-none');
                buttons.children[5].innerHTML = '<i class="fas fa-volume-off"></i>';

                playerControls.appendChild(buttons);                

                playerContainer.appendChild(playerControls);
                return playerContainer;
            },

            renderPlayerTime : function(){
                let timerContainer = MainApp.getNewNode('div', 'timer-container');
                let timerText = MainApp.getNewNode('span', 'player-time');
                timerText.innerHTML = '00:00 / 00:00';
                timerContainer.appendChild(timerText);
                return timerContainer;
            },

            renderPlayerProgress : function (){
                let body = MainApp.body;
                let progressWrapper = MainApp.getNewNode('div', 'progress');
                let progressBar = MainApp.getNewNode('progress', 'progress-bar');
                let progressSeeker = MainApp.getNewNode('div', 'progress-seeker');
                let seekerTimer = MainApp.getNewNode('span', 'seeker-timer');
                seekerTimer.innerHTML = '00:00 / 00:00';

                progressSeeker.appendChild(seekerTimer);

                progressWrapper.appendChild(progressBar);
                progressWrapper.appendChild(progressSeeker);

                return progressWrapper;
            },

            updateSeeker : function(width, player){
                    let seekerLeftPos = width * 100;
                    let seeker = document.querySelector('.progress-seeker');
                    seeker.style.left = seekerLeftPos + '%';   
                    seeker.firstChild.innerHTML = MainApp.timeToSeconds(player.duration * width) + ' / ' + MainApp.timeToSeconds(player.duration);
            },

            getButtons : function(buttonCount){
                let buttons = MainApp.getNewNode('div', 'button-wrapper');
                for (let i = 0; i < buttonCount; i++){
                    let button = MainApp.getNewNode('div', 'button-control');
                    buttons.appendChild(button);
                }
                return buttons;
            }
        },

        playlistObject : {
            
            currentPlaylist : {
                contents : [],

                get length() {return this.contents.length},

                get totalPlaytime() {
                    if (this.contents.length > 1){
                        return this.contents.reduce( (totalVal, currentVal) =>{
                            return {playtime : totalVal.playtime + currentVal.playtime};
                        });
                    }
                    else if (this.contents.length = 1) return {playtime : this.contents[0].playtime};
                    else return {playtime : 0};
                },

                get allSongs(){
                    songList = currentPlaylist.content.forEach( elem =>{
                        elem.getSongData;
                    });
                    return songList;
                },

                Song : function Song(filePath,name,playtime,id,position){

                    this.filePath = filePath;
                    this.name = name;
                    this.playtime = playtime;
                    this.id = id;
                    this.position = position;
                    this.node = '';

                    this.getSongData = function(){
                        let data = {name : this.name, playtime: this.playtime, filePath : this.filePath, position : this.position};
                        return data;
                    }
                },

                addSongToPlaylist : function (obj){
                    let name = this.getFileNameFromPath(obj.filePath)
                    let newSong = new this.Song(obj.filePath,name,obj.playtime,obj.id,obj.position + 1);
                    this.contents.push(newSong);
                },

                getFileNameFromPath : function (str) {
                    return str.split('\\').pop().split('/').pop();
                },
                
                changePlaylistOrder : function (positionFrom, positionTo){
                    let from = positionFrom.lastChild.innerHTML;
                    if (positionTo.lastChild)
                        var to = positionTo.lastChild.innerHTML ;
                    else
                        var to = this.contents.length;

                    let fromObj = this.contents.splice(from-1,1);
                    this.contents.splice(to-1,0,fromObj[0])
                    this.contents.forEach((elem,i) =>{
                        elem.position = i+1;
                    })
                    MainApp.playerObject.initPlayer();
                },

                POSTnewSong : async function (files,row){
                    console.log(files, row);
                    const promises = ([...files]).map(uploadFile);
                    await Promise.all(promises);

                    function uploadFile(file){
                        return new Promise(function (resolve,reject){
                            let xhr = new XMLHttpRequest()
                            let formData = new FormData();
                            xhr.open('post', '/uploadsong', true);
    
                            xhr.onload = function() {
                                if (xhr.status == 200){
                                    resolve (xhr.response);
                                } else if (xhr.status !=200){
                                    reject(console.log('does not works ',e));
                                }
                            };
    
                            formData.append('file',file);
                            xhr.send(formData);
                        })
                    }
                },

                deleteSong : async function (files){
                    let deleteFiles = [];
                    files.forEach((elem) => {deleteFiles.push(elem.firstChild.innerHTML);
                    });
                    const promise = deleteFile(deleteFiles)
                    await Promise.resolve(promise);

                    function deleteFile(file){
                        return new Promise(function (resolve,reject){
                            let args = '';
                            file.forEach((elem, i) =>{
                                args += elem
                                if ( i + 1 < file.length)
                                    args += '&deleteCandidate=';
                            });
                            let xhr = new XMLHttpRequest()
                            xhr.open('get', '/deleteSong?deleteCandidate=' + args, true);

                            xhr.onload = function() {
                                if (xhr.status == 200){
                                    resolve (xhr.response);
                                } else if (xhr.status !=200){
                                    reject(console.log('does not works ',e));
                                }
                            };
                            xhr.send();
                        })
                    }
                }
            },

            getRemotePlaylist : function() {
                return new Promise (function (resolve,reject){
                    let xhr = new XMLHttpRequest();
                    xhr.open('post', 'getremoteplaylist');
                    xhr.onload = function() {
                        if(xhr.status == 200){
                            let playlist = JSON.parse(xhr.response);
                            resolve(playlist);
                        }
                        else{
                            console.log('Error',xhr.statusText)
                            reject(xhr.statusText);
                        }
                    };
                    xhr.send();
                })
            },

            initSocketIo : function (){
            let socket = io.connect();

                socket.on('update', async (data) =>{
                    await MainApp.playlistObject.updatecurrentPlaylist();
                    MainApp.playerObject.initPlayer();
                });
            },

            updatecurrentPlaylist : async function(){
                const promises = this.getRemotePlaylist();
                let updatedPlaylist = await Promise.resolve(promises);
                this.currentPlaylist.contents = [];
                updatedPlaylist.forEach(elem => this.currentPlaylist.addSongToPlaylist(elem));
                this.renderPlaylist();               
            },

            get fullPlaylist() {
                let playlist = [];
                this.currentPlaylist.contents.forEach( elem => {
                    playlist.push(elem);
                });
                return playlist;
            },            

            renderPlaylist : function (){
                let body = MainApp.body;
                if(body.querySelector('.playlist-container'))
                    body.removeChild(body.querySelector('.playlist-container'));

                let playlistContainer = MainApp.getNewNode('div', 'playlist-container');

                this.fullPlaylist.forEach(elem => {
                    playlistContainer.appendChild(this.getSongElement(elem));
                });

                playlistContainer.appendChild(this.getBottomRow(this.currentPlaylist));
                this.getBottomRow(this.currentPlaylist);
                body.appendChild(playlistContainer);
            },

            getSongElement : function(song){
                let column = '';
                let songListEntry = MainApp.getNewNode('div', 'playlist-song');
                songListEntry.setAttribute('draggable', 'true');

                Object.keys(song.getSongData()).forEach( (elem, i) =>{
                    switch(elem){
                        case 'playtime':
                            column = MainApp.getNewNode('div', ['playlist-column',elem, 'col-auto']);
                            let date = new Date(null);
                            date.setSeconds(Object.values(song.getSongData())[i])
                            let formattedTime = date.toISOString().substr(14,5);
                            column.innerHTML = formattedTime;
                        break;

                        case 'position':
                            column = MainApp.getNewNode('div', ['playlist-column',elem,'col-auto', 'text-right']);
                            column.innerHTML = Object.values(song.getSongData())[i];
                        break;
                        
                        case 'filePath':
                            column = MainApp.getNewNode('div', ['playlist-column',elem, 'col','d-none','d-xl-block']);
                            column.innerHTML = Object.values(song.getSongData())[i];
                        break;

                        default:
                            column = MainApp.getNewNode('div', ['playlist-column',elem, 'col']);
                            column.innerHTML = Object.values(song.getSongData())[i];
                        break;  
                    };
                    songListEntry.appendChild(column);
                });
                song.node = songListEntry;
                return songListEntry;
            },

            getBottomRow : function(){
                let buttomRow = MainApp.getNewNode('div', 'playlist-bottom');
                
                return buttomRow;
            },

            handleDraggables: {

                dragSrcEl : null,
                draggedType : 'default',
    
                handleDragStart : function(event) {
                    event.target.classList.add('dragged');
                    MainApp.playlistObject.handleDraggables.dragSrcEl = event.target;
                    event.originalEvent.dataTransfer.effectAllowed = 'move';
                    event.originalEvent.dataTransfer.setData('text/html', event.target.innerHTML);

                    let hiddenGhost = this.cloneNode(true);
                    hiddenGhost.style.backgroundColor = "black";
                    hiddenGhost.style.display = "none";
                    document.body.appendChild(hiddenGhost);
                    event.originalEvent.dataTransfer.setDragImage(hiddenGhost, 0, 0);
                },
    
                handleDragOver : function(event) {
                    MainApp.playlistObject.handleDraggables.draggedType = event.originalEvent.dataTransfer.items[0].type;

                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    if( MainApp.playlistObject.handleDraggables.draggedType == 'audio/mpeg'){
                        event.originalEvent.dataTransfer.dropEffect = 'copy';

                    }
                    else if(MainApp.playlistObject.handleDraggables.draggedType = "text/html"){
                    event.originalEvent.dataTransfer.dropEffect = 'move';
                    }
                    return false;
                },
    
                handleDragEnter : function() {
                    this.classList.add('over');
                    if (MainApp.playlistObject.handleDraggables.draggedType == 'text/html'){
                        if (MainApp.playlistObject.handleDraggables.dragSrcEl != this)
                            this.parentNode.insertBefore(MainApp.playlistObject.handleDraggables.dragSrcEl, this);
                    }
                },
                
                handleDragLeave : function() {
                    this.classList.remove('over');
                },
    
                handleDrop : function (event) {
                    event.stopPropagation();
                    event.preventDefault();

                    if(MainApp.playlistObject.handleDraggables.draggedType == "audio/mpeg"){
                        let files = event.originalEvent.dataTransfer.files;
                        let row = event.currentTarget

                        MainApp.playlistObject.handleDraggables.clearDraggedClasses();
                        MainApp.playlistObject.currentPlaylist.POSTnewSong(files, row);
                    }
                    else{
                        if (MainApp.playlistObject.handleDraggables.dragSrcEl != this) {
                        }
                        MainApp.playlistObject.handleDraggables.dragSrcEl.classList.remove('dragged');
                        MainApp.playlistObject.currentPlaylist.changePlaylistOrder(MainApp.playlistObject.handleDraggables.dragSrcEl, event.currentTarget);
                    }
                    return false;               
                },
    
                handleDragEnd : function(event) {
                    MainApp.playlistObject.handleDraggables.draggedType = 'default';
                    MainApp.playlistObject.handleDraggables.clearDraggedClasses();

                },

                clearDraggedClasses : function(){
                    let rows = document.querySelectorAll('.playlist-song');
                    [].forEach.call(rows, function (row) {
                        row.classList.remove('over');
                    });
                }
            }
        },

        init : async function () {
            MainApp.playerObject.renderPlayer();
            MainApp.addEventListeners();
            MainApp.playlistObject.initSocketIo();
        }
    }

    MainApp.init();

});