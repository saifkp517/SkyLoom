import * as THREE from "three"
import {w3cwebsocket as Websocket} from "websocket"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js"
import {FirstPersonControls} from "three/examples/jsm/controls/FirstPersonControls.js"
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js"
import {DoubleSide, Vector3} from "three";
import {useEffect, useRef, useState} from "react";

function App() {

    let ws: any = new WebSocket("ws://localhost:8080");

    let player = {
        height: 0.5,
        turnSpeed: 0.05,
        speed: 0.08,
        jumpHeight: 0.2,
        gravity: 0.01,
        velocity: 0,
        jumps: true
    }

    /////////////////////building a terrain ///////////////////////

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap
    document.body.appendChild( renderer.domElement );

    //automatic resize
    window.addEventListener('resize', () => {
        let width = window.innerWidth;
        let height = window.innerHeight;

        renderer.setSize(width, height)
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    })

    //camera position
    camera.position.set(0, player.height, -5);
    ws.onmessage = (e: any) => {
        if(e.data) {
            let cameraPosition = JSON.parse(e.data)
            cube.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
        }
    }
    camera.lookAt(new THREE.Vector3(0, player.height, 0));

    //box
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhongMaterial( { color: 0x0000ff} );
    const cube = new THREE.Mesh( geometry, material );
    cube.castShadow = true;
    cube.receiveShadow = false;

    scene.add( cube );

    //plane
    const planeGeo = new THREE.PlaneGeometry(2000, 2000, 8, 8);
    const planeMat = new THREE.MeshPhongMaterial({ color: 0x808080 })
    const plane = new THREE.Mesh(planeGeo, planeMat)
    plane.receiveShadow = true;
    scene.add(plane)
    plane.rotateX(- Math.PI * 0.5)


    //lights
    const light = new THREE.DirectionalLight( 0xffffff, 1);
    const light1 = new THREE.DirectionalLight( 0xffffff, 1);
    const pointLight = new THREE.PointLight( 0xffffff, 0.5)

    light.castShadow = true
    light1.castShadow = true;
    pointLight.castShadow = true;

    light.position.set(0, 1, 5);
    light1.position.set(0, 1, -5)
    pointLight.position.set(0, 3, 0)

    scene.add( light );
    scene.add( light1 )
    scene.add( pointLight )

    ///////////////////keyboard controls////////////////////////////

    const mouseControls = new PointerLockControls(camera, renderer.domElement);
    document.addEventListener( 'click', () => {
        mouseControls.lock()
    }, false)


    const keysDown: any = {
        "KeyW": 0,
        "KeyA": 0,
        "KeyS": 0,
        "KeyD": 0,
        "Space": 0
    }

    document.addEventListener("keydown", ({ code }) => {
        keysDown[code] = 1 
    })
    document.addEventListener("keyup", ({ code }) => {
        keysDown[code] = 0
    })

    function updateControls() {

        const forwardDirection = keysDown["KeyW"] - keysDown["KeyS"];
        const rightDirection = keysDown["KeyD"] - keysDown["KeyA"];


        if(forwardDirection || rightDirection) {
            let PositionVector = JSON.stringify(camera.position);
            ws.send(PositionVector)
        }


        mouseControls.moveForward(forwardDirection * player.speed)
        mouseControls.moveRight(rightDirection * player.speed)

        player.velocity += player.gravity;
        camera.position.y -= player.velocity;


        if(camera.position.y < player.height) {
            camera.position.y = player.height;
            player.jumps = false;
        }

        function otherControls() {

            if(keysDown["Space"] == 1) {
                if( player.jumps) return false;
                player.jumps = true
                player.velocity = -player.jumpHeight
            }

        }
        otherControls()
    }


    ////////main animation function
    function animate() {

        requestAnimationFrame( animate );
        updateControls();
        renderer.render( scene, camera );

    };

    animate();
    return (
        <div className="App">
        </div>
    )
}

export default App
