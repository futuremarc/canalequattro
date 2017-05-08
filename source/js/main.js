$(document).ready(function() {})

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var audioCtx = new(window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext)();
var analyserNode = audioCtx.createAnalyser();
var bufferLength = analyserNode.frequencyBinCount;
var mic_input = new Uint8Array(bufferLength);

var scene, buffer_scene, camera, buffer_cam, renderer, container;
var image_tex, video, buffer, pre_video_tex, video_tex, video_mat, video_mesh, video_geo, buffer_mat, buffer_geo, buffer_mesh, video_tex_norm, video_mat_norm, video_mesh_norm, video_geo_norm;
var ortho_width = 1920,
    ortho_height = 1080,
    ortho_near = -1,
    ortho_far = 1;
var timer = 0,
    zero_to_one = 0;

var socket = io.connect('http://localhost:5050', {
    path: '/socket'
});

var is_bnw = false,
    is_fullscreen = false;
var the_mode = 'image',
    the_mode_index = 0,
    blending_mode = 0;
var mic_sensitivity = 2.2,
    mic_compressor = 2.3,
    colorR = .0,
    colorG = .0,
    colorB = .0,
    contrast = 1.6,
    brightness = 0.

var container
var dates = ['7-5-2017 13:43:00 EDT', '7-5-2017 13:43:30 EDT', '7-5-2017 12:44:00 EDT', '9-5-2017 07:00:00 EDT', '9-5-2017 14:00:00 EDT', '9-5-2017 20:00:00 EDT', '9-5-2017 23:00:00 EDT'],
    interval = 1000,
    currentDuration

var rendererToImageRatio = 2.1

var adjustViewspace = function() {

    var imgConWidth = imgContainer.offsetWidth
    var rendererWidth = imgConWidth / rendererToImageRatio

    container.style.width = rendererWidth + 'px'
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
};

var setupAudioNodes = function(stream) {
    var sampleSize = 1024;
    var sourceNode = audioCtx.createMediaStreamSource(stream);
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

    mic_input = new Uint8Array(analyserNode.frequencyBinCount);
};

var get_mic_input = function() {
    analyserNode.getByteFrequencyData(mic_input);
};


function onInterval() {

    currentDuration = moment.duration(currentDuration.asMilliseconds() - interval, 'milliseconds');
    var d = moment.duration(currentDuration).days(),
        h = moment.duration(currentDuration).hours(),
        m = moment.duration(currentDuration).minutes(),
        s = moment.duration(currentDuration).seconds();

    d = $.trim(d).length === 1 ? '0' + d : d;
    h = $.trim(h).length === 1 ? '0' + h : h;
    m = $.trim(m).length === 1 ? '0' + m : m;
    s = $.trim(s).length === 1 ? '0' + s : s;

    // show how many hours, minutes and seconds are left
    $d.text(d);
    $h.text(h);
    $m.text(m);
    $s.text(s);


    if (d < 1 && h < 1 && m < 1 && s < 1 && !isVideoPlaying) {
        $clock.hide()
        console.log('video play from beginning...')
        switchToVideoMode()
        window.isVideoPlaying = true
        video.currentTime = 0
        clearInterval(countdownInterval);
        video.play()
        return
    }


}

var countdownInterval

function onVideoLoaded() {

    console.log('video loaded')

    countdownInterval = setInterval(onInterval, interval);
    getCurrentCountdown(dates)
    this.removeEventListener('loadedmetadata', onVideoLoaded)

}

var getVideo = function() {

    video = document.querySelector('video');
    enableInlineVideo(video)

    document.addEventListener('touchstart', function () {
        video.play();
    });

    video.width = ortho_width;
    video.height = ortho_height;
    video.muted = true;
    video.src = 'video/test.mp4'
    video.load()

    video.onended = function() {
        console.log('video done show countdown...')

        switchToImageMode()
        $clock.show()
        this.currentTime = 0
        this.addEventListener('loadedmetadata', onVideoLoaded)
        this.load()
        isVideoPlaying = false
    }

    video.addEventListener('loadedmetadata', onVideoLoaded)

    if (navigator.getUserMedia) {
        navigator.getUserMedia({
            audio: true,
            video: {
                width: ortho_width,
                height: ortho_height,
                facingMode: {
                    exact: "environment"
                }
            }
        }, function(stream) {
            setupAudioNodes(stream);
        }, function(err) {
            console.log('failed to get a steram : ', err);
        });
    } else {
        console.log('user media is not supported');
    }
};


function getCurrentCountdown(dates) {

    var currentCountdown

    for (var i = 0; i < dates.length; i++) {

        var eventTime = moment(dates[i], 'DD-MM-YYYY HH:mm:ss').unix();
        var currentTime = moment().unix();
        var diffTime = eventTime - currentTime;
        var duration = moment.duration(diffTime * 1000, 'milliseconds');

        console.log('diffTime', diffTime, 'duration', duration.asMilliseconds(), 'video duration', video.duration, diffTime < 0 && diffTime > -video.duration)

        if (diffTime < 0 && diffTime > -video.duration + 1) {

            console.log('video play from', diffTime * -1)
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

var imgContainer = $('#tv-set')[0]


var init = function() {


    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(ortho_width / -2, ortho_width / 2, ortho_height / 2, ortho_height / -2, ortho_near, ortho_far);
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 0);
    container = document.getElementById('canale-container');

    var imgConWidth = imgContainer.offsetWidth
    var rendererWidth = imgConWidth / rendererToImageRatio
    container.style.width = rendererWidth + 'px'

    scrollPageToCenter()


    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    container.appendChild(renderer.domElement);
    $clock = $('<div class="clock animate-glitch"></div>').appendTo(container)


    $d = $('<div>00</div>').appendTo($clock); //use spaces as placeholders for numbers
    $h = $('<div>00</div>').appendTo($clock);
    $m = $('<div>00</div>').appendTo($clock);
    $s = $('<div>00</div>').appendTo($clock);
    document.body.appendChild(container);

    video_tex = new THREE.Texture(video);

    var src = 'img/tv-screen.png'

    image_tex = new THREE.TextureLoader().load(src);

    var image = new Image();
    image.src = src;

    video_tex.minFilter = THREE.LinearFilter //- to use non powers of two image
    image_tex.minFilter = THREE.LinearFilter

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

    video_geo = new THREE.PlaneGeometry(ortho_width, ortho_height);
    video_mesh = new THREE.Mesh(video_geo, video_mat);
    scene.add(video_mesh);

    videos.glitch = video_mesh

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

    videos.norm = video_mesh_norm

    scene.add(camera);

    switchToImageMode()

    animate();

};

var videos = {},
    isGlitch = false,
    isVideoPlaying = false


function switchToVideoMode() {

    video_mat.uniforms['u_comp_mode'].value = 0
    video_mesh_norm.material.map = video_tex
    video_tex.needsUpdate = true
    image_tex.needsUpdate = true

}

isPowered = false

function onClick(){

    isPowered = !isPowered
    if (isPowered){
        timer = 0
        $('#tv-power').show()
        $('#tv-standby').hide()
        $('#tv-set').removeClass('transparent')
        $('#tv-reflection').show()
        $('#tv-glow').show()
        $('canvas').removeClass('transparent')
        $clock.removeClass('animate-glitch')

    }else{
        $('#tv-power').hide()
        $('#tv-standby').show()
        $('#tv-set').addClass('transparent')
        $('#tv-reflection').hide()
        $('#tv-glow').hide()
        $('canvas').addClass('transparent')
        $clock.addClass('animate-glitch')
    }
    adjustViewspace()
}

$(document).click(onClick)



function switchToImageMode() {
    video_mat.uniforms['u_comp_mode'].value = 1;
    video_mesh_norm.material.map = image_tex
    video_tex.needsUpdate = true
    image_tex.needsUpdate = true
}
var render = function() {
    camera.lookAt(scene.position);

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        video_tex.needsUpdate = true;
        image_tex.needsUpdate = true
    }

    if (!isVideoPlaying) {
        video_mesh_norm.visible = false
        video_mesh.visible = false
    }

    if (!isPowered) return

    if (timer === 0) $clock.removeClass('animate-glitch')
    else if (timer === 50) $clock.addClass('animate-glitch')
    else if (timer === 400) $clock.removeClass('animate-glitch')
    else if (timer === 600) $clock.addClass('animate-glitch')
    else if (timer === 900) $clock.removeClass('animate-glitch')

    if (timer > 50 && timer < 400) isGlitch = true
    else if (timer > 400 && timer < 600) isGlitch = false
    else if (timer > 600 && timer < 900) isGlitch = true
    else if (timer > 900 && timer < 1000) isGlitch = false
    else if (timer > 1000) timer = 0

    if (isGlitch) {


        video_mesh_norm.visible = false
        video_mesh.visible = true


        var tre = mic_input[200] / 255.;
        var mid = mic_input[100] / 255.;
        var bass = mic_input[2] / 255.;

        //console.log('tre : ', tre, ', mid : , ', mid, ', bass : ', bass);

        video_mat.uniforms['u_video_tex'].value = video_tex;
        video_mat.uniforms['u_image_tex'].value = image_tex;

        if (the_mode === 'cam') {

        } else if (the_mode === 'image') {

        } else if (the_mode === 'composition')
            video_mat.uniforms['u_comp_mode'].value = 2;

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



    } else {
        video_mesh.visible = false
        video_mesh_norm.visible = true
    }


    renderer.clear();
    renderer.render(scene, camera);

    timer++;

    if (zero_to_one > 1.) {
        zero_to_one = 0.;
    }
    zero_to_one += 0.001;
};

var animate = function() {
    requestAnimationFrame(animate);
    get_mic_input();
    render();
};


document.addEventListener('DOMContentLoaded', function() {
    getVideo();
    init();

});

window.addEventListener('resize', adjustViewspace, false);


function scrollPageToCenter(){

    var outer = window.innerWidth
    var inner = imgContainer.offsetWidth;
    $(document.body).scrollLeft((inner - outer) / 2)

    var outer = window.innerHeight
    var inner = imgContainer.offsetHeight;
    $(document.body).scrollTop((inner - outer) / 2)

}
