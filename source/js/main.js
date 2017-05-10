var dates = ['11-5-2017 07:00:00 EDT', '11-5-2017 14:00:00 EDT', '11-5-2017 20:00:00 EDT', '11-5-2017 23:00:00 EDT']

var scene, buffer_scene, camera, buffer_cam, renderer, container;
var image_tex, video, audio, audioTvOff, buffer, pre_video_tex, video_tex, video_mat, video_mesh, video_geo, buffer_mat, buffer_geo, buffer_mesh, video_tex_norm, video_mat_norm, video_mesh_norm, video_geo_norm;

var ortho_width = 1920,
    ortho_height = 1080,
    ortho_near = -1,
    ortho_far = 1;

var timer = 0,
    zero_to_one = 0;

var is_bnw = false,
    is_fullscreen = false,
    the_mode = 'image',
    the_mode_index = 0,
    blending_mode = 0,
    mic_sensitivity = 1.5,
    mic_compressor = 2.3,
    colorR = .0,
    colorG = .0,
    colorB = .0,
    contrast = 1.6,
    brightness = 0.

var container,
    interval = 1000,
    currentDuration,
    countdownInterval

var rendererToImageRatio = 2.1,
    isGlitch = false,
    isVideoPlaying = false,
    isTvPowered = false,
    imgContainer;



var animate = function() {
    requestAnimationFrame(animate);
    render();
};


var beat = 200;
var volume = 1;
var curveNumber = -3
var curving, height
var isGenerativeInput = false
var isWebGL = false

function isWebGLAvailable() {
    try {
        var canvas = document.createElement("canvas");
        return !!
            window.WebGLRenderingContext &&
            (canvas.getContext("webgl") ||
                canvas.getContext("experimental-webgl"));
    } catch (e) {
        return false;
    }

}

isWebGL = isWebGLAvailable()


function initGenerativeNoiseInput() {

    setInterval(function() {
        beat = 60 + Math.random() * 100;
        volume = Math.min(1, Math.max(0.1, volume + Math.random() - 0.5));
    }, 200);

    isGenerativeInput = true

}

function playOsc(startTime, endTime) {

    var osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;

    var gainNode = audioCtx.createGain();
    gainNode.gain.value = .05
    osc.connect(gainNode).connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(endTime);
}


function playCountdownSound() {

    playOsc(audioCtx.currentTime, audioCtx.currentTime + 0.25);
    playOsc(audioCtx.currentTime + 1, audioCtx.currentTime + 1.25);
    playOsc(audioCtx.currentTime + 2, audioCtx.currentTime + 2.25);


}

function getGenerativeInput() {


    curveNumber++
    if (curveNumber > 6) curveNumber = -3

    curving = Math.max(1, 30 * Math.abs(curveNumber));
    curving = curving + 100 * volume;

    height = Math.max(1, Math.min(curving, 240) + (Math.random() * 50 - 25));

}


var render = function() {

    camera.lookAt(scene.position);

    if (video.readyState === video.HAVE_ENOUGH_DATA) video_tex.needsUpdate = true;

    if (!isVideoPlaying) {
        video_mesh_norm.visible = false
        video_mesh.visible = false
    }

    if (!isTvPowered) return

    switch (timer) {

        case 0:
            $clock.removeClass('animate-glitch')
            break;
        case 150:
            $clock.removeClass('animate-glitch')
            break;
        case 700:
            $clock.removeClass('animate-glitch')
            break;
        case 50 || 600:
            $clock.addClass('animate-glitch')
            break;
        case 600:
            $clock.addClass('animate-glitch')
            break;
    }

    if (timer > 50 && timer < 150) {
        isGlitch = true
        if (!isVideoPlaying) audio.play();
    } else if (timer > 150 && timer < 600) {
        isGlitch = false
        if (!isVideoPlaying) audio.pause();
    } else if (timer > 600 && timer < 700) {
        isGlitch = true
        if (!isVideoPlaying) audio.play();
    } else if (timer > 700 && timer < 1200) {
        isGlitch = false
        if (!isVideoPlaying) audio.pause();
    } else if (timer > 1200) {
        timer = 0
    }

    if (isGlitch && !isVideoPlaying) {

            video_mesh_norm.visible = false
            video_mesh.visible = true

        if (isWebGL) {

            if (isGenerativeInput) {

                getGenerativeInput()

                var tre = height / 255.;
                var mid = height / 255.;
                var bass = height / 255.;


            } else {

                getAudioInput();

                var tre = audioInput[200] / 255.;
                var mid = audioInput[100] / 255.;
                var bass = audioInput[2] / 255.;

            }


            video_mat.uniforms['u_video_tex'].value = video_tex;
            video_mat.uniforms['u_image_tex'].value = image_tex;
            video_mat.uniforms['u_blend_mode'].value = blending_mode;
            video_mat.uniforms['u_time'].value = timer;
            video_mat.uniforms['u_bass'].value = bass;
            video_mat.uniforms['u_mid'].value = mid;
            video_mat.uniforms['u_treble'].value = tre;
            video_mat.uniforms['u_0to1'].value = zero_to_one;
            video_mat.uniforms['u_random'].value = Math.random();
            video_mat.uniforms['u_bnw'].value = is_bnw;
            video_mat.uniforms['u_mic_sensitivity'].value = mic_sensitivity;
            video_mat.uniforms['u_mic_compressor'].value = mic_compressor;
            video_mat.uniforms['u_colorR'].value = colorR;
            video_mat.uniforms['u_colorG'].value = colorG;
            video_mat.uniforms['u_colorB'].value = colorB;
            video_mat.uniforms['u_brightness'].value = brightness;
            video_mat.uniforms['u_contrast'].value = contrast;
            renderer.clear();
        }
    } else {
        video_mesh.visible = false
        video_mesh_norm.visible = true
    }


    renderer.render(scene, camera);
    timer++;

    if (zero_to_one > 1.) zero_to_one = 0.;
    zero_to_one += 0.001;
};


var isCountdownInitialized = false

function onCountdownInterval() {

    currentDuration = moment.duration(currentDuration.asMilliseconds() - interval, 'milliseconds');

    var d = moment.duration(currentDuration).days();
    var h = moment.duration(currentDuration).hours();
    var m = moment.duration(currentDuration).minutes();
    var s = moment.duration(currentDuration).seconds();

    d = $.trim(d).length === 1 ? '0' + d : d;
    h = $.trim(h).length === 1 ? '0' + h : h;
    m = $.trim(m).length === 1 ? '0' + m : m;
    s = $.trim(s).length === 1 ? '0' + s : s;

    // show how many hours, minutes and seconds are left
    $d.text(d);
    $h.text(h);
    $m.text(m);
    $s.text(s);

    isCountdownInitialized = true

    if (d < 1 && h < 1 && m < 1 && s < 5 && s > 3 && !isVideoPlaying && isTvPowered) playCountdownSound()

    if (d < 1 && h < 1 && m < 1 && s < 1 && !isVideoPlaying) {

        console.log('play video from beginning...')

        $clock.hide()
        switchToVideoMode()
        window.isVideoPlaying = true
        video.currentTime = 0
        clearInterval(countdownInterval);
        video.play()
        if (isTvPowered) video.muted = false

        return
    }

}



function getCurrentCountdown(dates) {

    var currentCountdown

    for (var i = 0; i < dates.length; i++) {

        var eventTime = moment(dates[i], 'DD-MM-YYYY HH:mm:ss').unix();
        var currentTime = moment().unix();
        var diffTime = eventTime - currentTime;
        var duration = moment.duration(diffTime * 1000, 'milliseconds');

        if (diffTime < 0 && diffTime > -video.duration + 1) {

            console.log('play video from', diffTime * -1)
            switchToVideoMode()
            $clock.hide()
            currentCountdown = diffTime
            currentDuration = duration
            window.isVideoPlaying = true
            video.currentTime = diffTime * -1
            clearInterval(countdownInterval);
            video.play()
            break
        }

        if (diffTime > 0) {
            currentCountdown = diffTime
            currentDuration = duration
            console.log('currentCountdown', currentCountdown)
            break
        }

    }

    return currentCountdown

}


var initCanvas = function() {


    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(ortho_width / -2, ortho_width / 2, ortho_height / 2, ortho_height / -2, ortho_near, ortho_far);
    renderer = isWebGLAvailable() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    renderer.setClearColor(0x000000, 0);
    container = document.getElementById('canale-container');
 video_mesh.material.map = image_tex
    var imgConWidth = imgContainer.offsetWidth
    var rendererWidth = imgConWidth / rendererToImageRatio
    container.style.width = rendererWidth + 'px'

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    container.appendChild(renderer.domElement);

    video_tex = new THREE.Texture(video);

    var src = 'img/tv-screen.png'

    image_tex = new THREE.TextureLoader().load(src, function() {

        document.body.appendChild(container);
        console.log('done loading image')


        video_tex.minFilter = THREE.LinearFilter //- to use non powers of two image
        image_tex.minFilter = THREE.LinearFilter

        if (isWebGL){
        video_mat = new THREE.ShaderMaterial({
            uniforms: {
                'u_video_tex': {
                    type: 't',
                    value: video_tex
                },
                'u_image_tex': {
                    type: 't',
                    value: image_tex
                },
                'u_comp_mode': {
                    type: 'i',
                    value: 0
                },
                'u_blend_mode': {
                    type: 'i',
                    value: blending_mode
                },
                'u_buffer_2d': {
                    type: 't',
                    value: null
                },
                'u_time': {
                    type: 'f',
                    value: 0
                },
                'u_bass': {
                    type: 'f',
                    value: 0
                },
                'u_mid': {
                    type: 'f',
                    value: 0
                },
                'u_treble': {
                    type: 'f',
                    value: 0
                },
                'u_0to1': {
                    type: 'f',
                    value: 0
                },
                'u_random': {
                    type: 'f',
                    value: 0
                },
                'u_bnw': {
                    type: 'b',
                    value: false
                },
                'u_mic_sensitivity': {
                    type: 'f',
                    value: mic_sensitivity
                },
                'u_mic_compressor': {
                    type: 'f',
                    value: mic_compressor
                },
                'u_colorR': {
                    type: 'f',
                    value: colorR
                },
                'u_colorG': {
                    type: 'f',
                    value: colorG
                },
                'u_colorB': {
                    type: 'f',
                    value: colorB
                },
                'u_contrast': {
                    type: 'f',
                    value: contrast
                },
                'u_brightness': {
                    type: 'f',
                    value: brightness
                }
            },
            vertexShader: document.getElementById('video_vert').textContent,
            fragmentShader: document.getElementById('video_frag').textContent,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });
    }else{

         video_mat = new THREE.MeshBasicMaterial({
            map: image_tex,
            color: 0xffffff,
            transparent: true,
            opacity: .93,
            depthWrite: false,
            transparent: true
        });

    }

        video_geo = new THREE.PlaneGeometry(ortho_width, ortho_height);
        video_mesh = new THREE.Mesh(video_geo, video_mat);
        scene.add(video_mesh);

        video_mat_norm = new THREE.MeshBasicMaterial({
            map: image_tex,
            color: 0xffffff,
            transparent: true,
            opacity: .93,
            depthWrite: false,
            transparent: true
        });

        video_geo_norm = new THREE.PlaneGeometry(ortho_width, ortho_height);
        video_mesh_norm = new THREE.Mesh(video_geo_norm, video_mat_norm);

        scene.add(video_mesh_norm);
        scene.add(camera);

        switchToImageMode()
        $(document).click(onDocumentClick)
        $('.loading').hide()
        $('.content').show()
        animate();
    });


};

var isCanaleInitialized = false
var $clock

function showScene() {

    if (!isVideoPlaying) $clock.show()
    $('#tv-power').show()
    $('#tv-standby').hide()
    $('#tv-set').removeClass('animate-glow-reflection-off')
    $('#tv-reflection').removeClass('animate-glow-reflection-off')
    $('#tv-reflection').addClass('animate-glow-reflection')
    $('#tv-glow').show()
    $('canvas').removeClass('transparent')

}

function hideScene() {

    $clock.hide()
    $('#tv-power').hide()
    $('#tv-standby').show()
    $('#tv-set').addClass('animate-glow-reflection-off')
    $('#tv-reflection').removeClass('animate-glow-reflection')
    $('#tv-reflection').addClass('animate-glow-reflection-off')
    $('#tv-glow').hide()
    $('canvas').addClass('transparent')
}

function onDocumentClick() {

    if (!isCanaleInitialized && video && audio) {

        console.log('canale initialized')
        video.play();
        if (!isVideoPlaying) video.pause()
        audio.play();
        isCanaleInitialized = true
    }

    isTvPowered = !isTvPowered

    if (isTvPowered) {

        timer = 0 //reset glitch timer
        showScene()

        if (isCanaleInitialized) {
            audioTvOff.pause()
            video.muted = false

            if (isVideoPlaying) audio.pause()
            else audio.play()
        }


    } else {

        hideScene()

        if (isCanaleInitialized) {
            audioTvOff.play()
            audio.pause()
            video.muted = true
        }
    }

    adjustViewspace()

}



function switchToImageMode() {

    if (isWebGL) video_mat.uniforms['u_comp_mode'].value = 1;
    else video_mesh.material.map = image_tex

    video_mesh_norm.material.map = image_tex
    video_tex.needsUpdate = true
    image_tex.needsUpdate = true
}


function switchToVideoMode() {

    if (isWebGL) video_mat.uniforms['u_comp_mode'].value = 0
    else video_mesh.material.map = video_tex
    video_mesh_norm.material.map = video_tex
    video_tex.needsUpdate = true
    image_tex.needsUpdate = true
}

var audioCtx, analyserNode, bufferLength, audioInput, audioEnv

var initAudioNodes = function(source) {

    audioEnv = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext
    audioCtx = new audioEnv();
    analyserNode = audioCtx.createAnalyser();
    bufferLength = analyserNode.frequencyBinCount;
    audioInput = new Uint8Array(bufferLength);


    var sampleSize = 1024;
    var sourceNode = audioCtx.createMediaElementSource(source);
    var filter_low = audioCtx.createBiquadFilter();
    var filter_high = audioCtx.createBiquadFilter();

    filter_low.frequency.value = 60.0;
    filter_high.frequency.value = 1280.0;
    filter_low.type = 'lowpass';
    filter_high.type = 'highpass';
    filter_low.Q = 10.0;
    filter_high.Q = 1.0;

    analyserNode.smoothingTimeConstant = 0.0;
    analyserNode.fftSize = 1024;

    sourceNode.connect(filter_low);
    sourceNode.connect(filter_high);

    filter_low.connect(analyserNode);
    filter_high.connect(analyserNode);

    analyserNode.connect(audioCtx.destination)

    audioInput = new Uint8Array(analyserNode.frequencyBinCount);
};

var getAudioInput = function() {
    analyserNode.getByteFrequencyData(audioInput);
};


function initAudioInput() {

    audioTvOff = document.getElementById('noise-tv-off');
    audioTvOff.loop = true
    audioTvOff.volume = .1
    audioTvOff.play()

    audio = document.getElementById('noise-tv-on');
    audio.loop = true
    audio.volume = .1
    if (!isIOS()) initAudioNodes(audio)

}


function onVideoLoaded() {
    console.log('video loaded')

    countdownInterval = setInterval(onCountdownInterval, interval);
    getCurrentCountdown(dates)
    this.removeEventListener('loadedmetadata', onVideoLoaded)

}


function onVideoEnded() {
    console.log('video done show countdown...')

    switchToImageMode()
    $clock.show()
    this.currentTime = 0
    this.addEventListener('loadedmetadata', onVideoLoaded)
    this.load()

    isVideoPlaying = false
}


function initVideoInput() {

    video = document.getElementById('tv-video');
    enableInlineVideo(video)

    video.width = ortho_width;
    video.height = ortho_height;
    video.src = 'video/phoenix.mp4'

    $(video).on('ended', onVideoEnded)
    $(video).on('loadedmetadata', onVideoLoaded)

    video.load()

};



var adjustViewspace = function() {

    var imgConWidth = imgContainer.offsetWidth
    var rendererWidth = imgConWidth / rendererToImageRatio

    container.style.width = rendererWidth + 'px'
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
};

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

var $d, $h, $m, $s

function onDocumentLoaded() {

    imgContainer = $('#tv-set')[0]

    container = document.getElementById('canale-container')
    $clock = $('<div class="clock"></div>').appendTo(container)

    $d = $('<div></div>').appendTo($clock);
    $h = $('<div></div>').appendTo($clock);
    $m = $('<div></div>').appendTo($clock);
    $s = $('<div></div>').appendTo($clock);


    initVideoInput();
    initAudioInput()
    if (isIOS()) initGenerativeNoiseInput()
    initCanvas();

}

document.ontouchmove = function(e) {
    e.preventDefault();
}

var hour = 0
var minute = 0
var pace = 10

function initSchedule() {

    for (var i = 0; i < 24; i++) {

        hour++
        for (var j = 0; j < 60 / pace; j++) {
            minute += pace
            var date = '10-5-2017 ' + hour + ':' + minute + ':00 EDT'
            dates.push(date)
        }
        minute = 0
    }
}

var everythingLoaded = setInterval(function() {
    if (/complete/.test(document.readyState)) {
        clearInterval(everythingLoaded);
        onDocumentLoaded()
        window.addEventListener('resize', adjustViewspace, false);
    }
}, 10);