import * as THREE from '/build/three.module.js';
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js';

// ================ GLOBAL VARIABLES
let scene;
let camera;
let renderer;
const canvas = document.querySelector("#app");

const updateSatAPI = 1000; // How often to update location in MS
let zoomIntoStation = false;
let cameraZ;

// Moon Variables
let theta = 0;
let dTheta = 2 * Math.PI / 5000;

// Station Variables
let sLat = 0;
let sLon = 0;

scene = new THREE.Scene();

// ================ CAMERA

const fov = 30; // Field Of View In Degree
const aspect = window.innerWidth / window.innerHeight; // Getting Windows Aspect Ratio

//Object Has To Be Within These Range
const near = 0.005;
const far = 1000;

camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;
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
controls.minPolarAngle = Math.PI/2;
controls.maxPolarAngle = Math.PI/2;
controls.minDistance = 2.5;
controls.maxDistance = 4;
controls.enablePan = false;
//controls.enableZoom = false;
controls.rotateSpeed = 1;

camera.position.x = 1;
camera.position.z = 3;
controls.update();

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
let spaceStationObject;

loader.load("models/ISS_stationary.glb", (gltf) => {
    spaceStationObject = gltf.scene;

    gltf.scene.scale.set(0.0005,0.0005,0.0005);
    gltf.scene.position.y = 0.7;
    scene.add(gltf.scene);
    },undefined,
    (err) => {
        console.error("Could not load asset " + err);
    }
);

// ================ SETUP LIGHT SOURCE

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Blue Ambient Light
const ambientLight2 = new THREE.AmbientLight(0x0042FF, 0.3);
scene.add(ambientLight2);

// Point Light
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 3, 5);
scene.add(pointLight);


// ================ ANIMATE EVERYTHING
const animate = () => {
    requestAnimationFrame(animate); // Run This Animation Each Frame
    earthMesh.rotation.y -= 0.0015; // Rotates Earth

    cloudMesh.rotation.y -= 0.001; // Roates Clouds Y Axist
    cloudMesh.rotation.x -= 0.0001; // Roates Clouds X Axist
    starMesh.rotation.y -= 0.0012; // Rotates Galaxy
    moonMesh.rotation.y -= 0.003; // Rotates Moon

    // Rotate Moon Around Earth
    theta += dTheta;
    moonMesh.position.x = 1.1 * Math.cos(theta);
    moonMesh.position.z = 1.1 * Math.sin(theta);

    // Rotating The Station Around Earth
    if(spaceStationObject != null) {
        const satLatLonPoint = calcPosFromLatLonRad(sLat, sLon, 0.75);
        const newPosition = new THREE.Vector3(satLatLonPoint[0], satLatLonPoint[1], satLatLonPoint[2]);
        spaceStationObject.position.lerp(newPosition, 0.1);
        spaceStationObject.rotation.y += 0.002;
    }

    //Zoom Into Station Control
    if(zoomIntoStation === true) {
        camera.lookAt(spaceStationObject.position);
        camera.position.set(spaceStationObject.position.x - 0.1, spaceStationObject.position.y, spaceStationObject.position.z - 0.2);
        pointLight.position.copy(camera.position);
    } else {
        // Controller Movement Update
        controls.update();
    }

    //Update Time
    const timeEl = document.querySelector("#time");
    timeEl.innerText= displayDate();

    render();
}

const render = () => {
    renderer.render(scene, camera); // Renders The Scene & The Camera
}

// Get Users Lat Long
returnUserLatLon();

function handleAPIData() {
    console.log(userLatLon);
    addHomePoint(userLatLon); // Adding Visitors Location
}

animate(); // Animates & Renders
getSatLongLat();
//getCountryFromLatLon();

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
    const pointGeometry = new THREE.SphereGeometry(0.01, 20, 20);

    const pointMaterial = new THREE.MeshPhongMaterial({
        //map: THREE.ImageUtils.loadTexture('textures/earthmap4k.jpg')
        color: 0xFF2D00
    });

    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    earthMesh.add(pointMesh);

    const latlonpoint = calcPosFromLatLonRad(latlons[0],latlons[1], 0.6);
    pointMesh.position.set(latlonpoint[0], latlonpoint[1], latlonpoint[2]);
}

function getSatLongLat () {
    var timer = setInterval(() => {
        const p = axios.get("http://api.open-notify.org/iss-now.json");
        p.then(result => {
            sLat = result.data.iss_position.latitude;
            sLon = result.data.iss_position.longitude;
            displayISS(result.data.iss_position.latitude, result.data.iss_position.longitude)
        }).catch(error => {
            console.log(error);
        })
    }, updateSatAPI);
}

// Gets Country From Lat Long
function getCountryFromLatLon (lat, lon) {
    var timer = setInterval(() => {
        axios
        .get('https://geocode.xyz/' + lat + ',' + lon + '?json=1&auth=106583156098176e15920809x109316')
        .then((result)=>{
            const countryEl = document.querySelector("#country");
            if(!result.data.country) {
                countryEl.innerText= "Region: Ocean Surface";
            } else {
                countryEl.innerText= "Region " + result.data.country;
            }
        })

        .catch((error) => {
            console.log(error);
        });
    }, 3000)
}

// Gets User Ip -> Returns Lat Long
let userLatLon = [];

function returnUserLatLon(){
    axios
    .get('http://ip-api.com/json/')
    .then((result)=>{
        //console.log(result.data.lat);
        userLatLon = [result.data.lat, result.data.lon];
        handleAPIData();
    })

    .catch((error) => {
        console.log(error);
    });
}

// Event Listener
document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
        if(zoomIntoStation) { // TURNING ZOOM IN TO SATELITE OFF
            zoomIntoStation = false;
            controls.enabled = true;
            camera.position.z = cameraZ;
            controls.minDistance = 2.5;
            controls.maxDistance = 4;
            pointLight.position.set(5, 3, 5);

            const page1El = document.querySelector("#page1");
            const page2E2 = document.querySelector("#page2");

            page1El.style.display = "flex";
            page2E2.style.display = "none";
        } else { // TURNING ZOOM IN ON
            zoomIntoStation = true;
            controls.enabled = false;
            cameraZ = camera.position.z;
            controls.minDistance = 1;
            controls.maxDistance = 7;

            const page1El = document.querySelector("#page1");
            const page2E2 = document.querySelector("#page2");

            page1El.style.display = "none";
            page2E2.style.display = "flex";
        }
    }
})