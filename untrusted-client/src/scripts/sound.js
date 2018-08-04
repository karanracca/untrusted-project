import Tracks from './tracks';

const sources = {
    'local': '',
    'cloudfront': 'http://dk93t8qfl63bu.cloudfront.net/'
};

export default class Sound {
    
    constructor(source) {
        this.muted = false;
        this.currentLevelNum = -1;
        this.sound = this;
        this.source = sources[source];
    }

    playTrack() {
        let audio = new Audio(Tracks.Adversity.path);
        audio.play();
    }
 
    // this.playTrackByName = function (name) {
    //     this.trackForLevel = name;

    //     var track = this.tracks[name];
    //     if (track.url) {
    //         var nowPlayingMsg = 'Now playing: "' + track.title + '" - <a target="_blank" href="' + track.url + '">' + track.artist + '</a>';
    //     } else {
    //         var nowPlayingMsg = 'Now playing: "' + track.title + '" - ' + track.artist;
    //     }
    //     $('#nowPlayingMsg').html(nowPlayingMsg);

    //     if (!this.muted && this.currentlyPlayingTrack !== name) {
    //         var path = this.source + track.path;
    //         $(this.bgPlayerElt).jPlayer('stop');
    //         $(this.bgPlayerElt).jPlayer("setMedia", {
    //             'mp3': path
    //         });
    //         $(this.bgPlayerElt).jPlayer('play');

    //         this.currentlyPlayingTrack = name;
    //     }
    // };

    // this.playTrackByNum = function (num) {
    //     this.playTrackByName(this.defaultTracks[(num - 1) % this.defaultTracks.length]);
    // };

    // this.playSound = function (name) {
    //     $(this.soundPlayerElt).jPlayer('stop');
    //     $(this.soundPlayerElt).jPlayer("setMedia", {
    //         'wav': 'sound/' + name + '.wav'
    //     });
    //     $(this.soundPlayerElt).jPlayer('play');
    // };

    // this.toggleSound = function() {
    //     if (this.muted) {
    //         this.bgPlayerElt.jPlayer('unmute');
    //         this.soundPlayerElt.jPlayer('unmute');
    //         $("#muteButton img").attr('src', 'images/mute-off.png');
    //         this.muted = false;
    //         this.playTrackByName(this.trackForLevel);
    //     } else {
    //         this.bgPlayerElt.jPlayer('mute');
    //         this.soundPlayerElt.jPlayer('mute');
    //         $("#muteButton img").attr('src', 'images/mute-on.png');
    //         this.muted = true;
    //     }
    // }
}
