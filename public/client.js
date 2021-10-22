import * as THREE from '/build/three.module.js';
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';

// ================ GLOBAL VARIABLES
let scene;
let camera;
let renderer;
const canvas = document.querySelector("#app");

// Moon Variables
let theta = 0;
let dTheta = 2 * Math.PI / 2000;

scene = new THREE.Scene();

// ================ CAMERA

const fov = 50; // Field Of View In Degree
const aspect = window.innerWidth / window.innerHeight; // Getting Windows Aspect Ratio

//Object Has To Be Within These Range
const near = 0.1;
const far = 1000;

camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 3;
camera.position.x = 1.5;
scene.add(camera);

// ================ RENDER

renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = false;
renderer.setClearColor(0x000000, 0.0);

// ================ ORBIT CONTROLLER 
const controls = new OrbitControls(camera, renderer.domElement);

// ================ SETUP EARTH

const earthGeometry = new THREE.SphereGeometry(0.6, 80, 80); // Radius, Width & Height in segment

const earthMaterial = new THREE.MeshPhongMaterial({ // Setting Up Earth Material
    map: THREE.ImageUtils.loadTexture('textures/earthmap4k.jpg'),
    bumpMap: THREE.ImageUtils.loadTexture('textures/earthbump4k.jpg'),
    bumpScale: 0.2
});

const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earthMesh); // Add Erath To The Scene

// ================ SETUP CLOUDS
const cloudGeometry = new THREE.SphereGeometry(0.615, 64, 64);

const cloudMaterial = new THREE.MeshPhongMaterial({
    map: THREE.ImageUtils.loadTexture('textures/earthClouds4k.png'),
    transparent: true
});

const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
scene.add(cloudMesh); // Add Clouds To The Scene

// ================ SETUP STARS
const starGeometry = new THREE.SphereGeometry(100, 64, 64);

const starMaterial = new THREE.MeshBasicMaterial({ // Using Basic Material As It Doesnt Reflect Light
    map: THREE.ImageUtils.loadTexture('textures/stars.jpg'),
    side: THREE.BackSide
})

const starMesh = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starMesh);

// ================ SETUP MOON
const moonGeometry = new THREE.SphereGeometry(0.1, 32, 32); // Radius, Width & Height in segment

const moonMaterial = new THREE.MeshPhongMaterial({ // Setting Up Moon Material
    map: THREE.ImageUtils.loadTexture('textures/moonmap4k.png'),
    bumpMap: THREE.ImageUtils.loadTexture('textures/moonbump.jpg'),
    bumpScale: 0.3
});

const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
scene.add(moonMesh); // Add Moon To The Scene
moonMesh.position.y = 0.13; // Setting Y Position Up From Earth

// ================ SETUP STATION
const loader = new GLTFLoader();
loader.load("modes/ISS_stationary.glb", (stationMesh) => {
    scene.add(stationMesh.scene);
    stationMesh.position.y = 1;
});

// ================ SETUP LIGHT SOURCE

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// Blue Ambient Light
const ambientLight2 = new THREE.AmbientLight(0x0042FF, 0.2);
scene.add(ambientLight2);

// Point Light
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 3, 5);
scene.add(pointLight);

const animate = () => {
    requestAnimationFrame(animate); // Run This Animation Each Frame
    earthMesh.rotation.y -= 0.0015; // Rotates Earth

    cloudMesh.rotation.y -= 0.001; // Roates Clouds Y Axist
    cloudMesh.rotation.x -= 0.0001; // Roates Clouds X Axist
    starMesh.rotation.y -= 0.0012; // Rotates Galaxy
    moonMesh.rotation.y -= 0.001; // Rotates Moon

    // Rotate Moon Around Earth
    theta += dTheta;
    moonMesh.position.x = 1 * Math.cos(theta);
    moonMesh.position.z = 1 * Math.sin(theta);

    // Controller Movement Update
    controls.update();
    render();
}

const render = () => {
    renderer.render(scene, camera); // Renders The Scene & The Camera
}

const latlons = [43.775982, -79.175377];
addHomePoint(latlons)
animate(); // Animates & Renders

// =========================================
// ============== FUNCTIONS
// =========================================

// This Functions Returns Vector3 From Lat Long
function calcPosFromLatLonRad(lat,lon, radius){
  
    const phi   = (90-lat)*(Math.PI/180);
    const theta = (lon+180)*(Math.PI/180);

    let x = -(radius * Math.sin(phi)*Math.cos(theta));
    let z = (radius * Math.sin(phi)*Math.sin(theta));
    let y = (radius * Math.cos(phi));
  
    return [x,y,z];
}

// Ads Visitors Location To The Map
function addHomePoint(latlons){
    console.log(latlons[0], latlons[1]);
    const pointGeometry = new THREE.SphereGeometry(0.01, 20, 20);

    const pointMaterial = new THREE.MeshPhongMaterial({ // Setting Up Earth Material
        //map: THREE.ImageUtils.loadTexture('textures/earthmap4k.jpg')
    });

    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    earthMesh.add(pointMesh);

    const latlonpoint = calcPosFromLatLonRad(latlons[0],latlons[1], 0.6);
    pointMesh.position.set(latlonpoint[0], latlonpoint[1], latlonpoint[2]);
}