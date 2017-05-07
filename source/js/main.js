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
var the_mode = 'cam',
    the_mode_index = 0,
    blending_mode = 0;
var mic_sensitivity = 2.2,
    mic_compressor = 2.3,
    colorR = .0,
    colorG = .0,
    colorB = .0,
    contrast = 1.6,
    brightness = 0.

var window_resize = function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
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
    //for(var i = 0; i < mic_input.length; i++){
    //if(mic_input[i] > 100)
    //console.log(i, "' ",mic_input[i]);
    //}
};

var get_webcam = function() {
    video = document.createElement('video');
    video.width = ortho_width;
    video.height = ortho_height;
    video.muted = true;
    video.src = 'video/test.mp4'
    video.load()

    function onVideoLoaded() {

        console.log('video loaded')

        diffTime = getCurrentCountdown(dates)

        if (diffTime > 0) {

            window.$d = $('<div class="days" ></div>').appendTo($clock);
            window.$h = $('<div class="hours" ></div>').appendTo($clock);
            window.$m = $('<div class="minutes" ></div>').appendTo($clock);
            window.$s = $('<div class="seconds" ></div>').appendTo($clock);

            setInterval(countdownInterval, interval);

        }

        this.removeEventListener('loadedmetadata', onVideoLoaded)

    }
    video.onended = function() {
        console.log('video done show countdown...')
        this.currentTime = 0
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

var init = function() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(ortho_width / -2, ortho_width / 2, ortho_height / 2, ortho_height / -2, ortho_near, ortho_far);
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.setSize( ortho_width, ortho_height );
    container = document.createElement('div');

    video_tex = new THREE.Texture(video);
    image_tex = new THREE.TextureLoader().load('img/test.png');
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


    video_tex_norm = new THREE.Texture(video);
    video_tex_norm.minFilter = THREE.LinearFilter

    video_mat_norm = new THREE.MeshBasicMaterial({
        map: video_tex_norm,
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


    container.appendChild(renderer.domElement);
    document.body.appendChild(container);

    animate();

};

videos = {}

var isGlitch = false
window.isVideoPlaying = false

var render = function() {
    camera.lookAt(scene.position);

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        video_tex.needsUpdate = true;
        video_tex_norm.needsUpdate = true;
    } //- live input has to be updated to refresh frames

    if (!isVideoPlaying) {
        video.currentTime = 0
        video_mesh_norm.visible = false
        video_mesh.visible = false

    }

    if (timer > 200 && timer < 400) isGlitch = true
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

        if (the_mode === 'cam')
            video_mat.uniforms['u_comp_mode'].value = 0;
        else if (the_mode === 'image')
            video_mat.uniforms['u_comp_mode'].value = 1;
        else if (the_mode === 'composition')
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


socket.on('img_url', function(data) {
    var image = new Image();
    image.src = data;
    image.onload = function() {
        image_tex = new THREE.Texture();
        image_tex.image = image;
        image_tex.needsUpdate = true;
        image_tex.minFilter = THREE.LinearFilter
    }
});
socket.on('mode', function(data) {
    switch (data) {
        case 'bnw':
            is_bnw = !is_bnw;
            break;
        case 'cam':
            the_mode = 'cam';
            break;
        case 'image':
            the_mode = 'image';
            break;
        case 'composition':
            the_mode = 'composition';
            break;
        default:
            break;
    }
});
socket.on('blend_mode', function(data) {
    switch (data) {
        case 'add':
            blending_mode = 0;
            break;
        case 'subtract':
            blending_mode = 1;
            break;
        case 'multiply':
            blending_mode = 2;
            break;
        case 'overlay':
            blending_mode = 3;
            break;
        default:
            break;
    }
});
socket.on('mic_sensitivity', function(data) {
    mic_sensitivity = data;
});
socket.on('mic_compressor', function(data) {
    mic_compressor = data;
});
socket.on('colorR', function(data) {
    colorR = data;
});
socket.on('colorG', function(data) {
    colorG = data;
});
socket.on('colorB', function(data) {
    colorB = data;
});
socket.on('contrast', function(data) {
    contrast = data;
});
socket.on('brightness', function(data) {
    brightness = data;
});

var create_socket_room = function(_ip) {
    socket.on('connect', function() {
        socket.emit('room', _ip);
    });
};

document.addEventListener('DOMContentLoaded', function() {
    get_webcam();
    init();

    $.getJSON("https://jsonip.com/?callback=?", function(data) {
        create_socket_room(data.ip);
    });
});
window.addEventListener('resize', window_resize, false);