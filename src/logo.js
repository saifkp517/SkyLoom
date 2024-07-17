/**
 * Trying to help someone on Reddit: https://www.reddit.com/r/threejs/comments/swcmhr/my_controls_stop_working_when_the_player_turns/hxlwxfu/?context=8&depth=9
 **/

const Euler = THREE.Euler
const EventDispatcher = THREE.EventDispatcher
const Vector3 = THREE.Vector3

const _euler = new Euler( 0, 0, 0, 'YXZ' );
const _vector = new Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

class PointerLockControls extends EventDispatcher {

	constructor( camera, domElement ) {

		super();

		if ( domElement === undefined ) {

			console.warn( 'THREE.PointerLockControls: The second parameter "domElement" is now mandatory.' );
			domElement = document.body;

		}

		this.domElement = domElement;
		this.isLocked = false;

		// Set to constrain the pitch of the camera
		// Range is 0 to Math.PI radians
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		const scope = this;

		function onMouseMove( event ) {

			if ( scope.isLocked === false ) return;

			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

			_euler.setFromQuaternion( camera.quaternion );

			_euler.y -= movementX * 0.002;
			_euler.x -= movementY * 0.002;

			_euler.x = Math.max( _PI_2 - scope.maxPolarAngle, Math.min( _PI_2 - scope.minPolarAngle, _euler.x ) );

			camera.quaternion.setFromEuler( _euler );

			scope.dispatchEvent( _changeEvent );

		}

		function onPointerlockChange() {

			if ( scope.domElement.ownerDocument.pointerLockElement === scope.domElement ) {

				scope.dispatchEvent( _lockEvent );

				scope.isLocked = true;

			} else {

				scope.dispatchEvent( _unlockEvent );

				scope.isLocked = false;

			}

		}

		function onPointerlockError() {

			console.error( 'THREE.PointerLockControls: Unable to use Pointer Lock API' );

		}

		this.connect = function () {

			scope.domElement.ownerDocument.addEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockchange', onPointerlockChange );
			scope.domElement.ownerDocument.addEventListener( 'pointerlockerror', onPointerlockError );

		};

		this.disconnect = function () {

			scope.domElement.ownerDocument.removeEventListener( 'mousemove', onMouseMove );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockchange', onPointerlockChange );
			scope.domElement.ownerDocument.removeEventListener( 'pointerlockerror', onPointerlockError );

		};

		this.dispose = function () {

			this.disconnect();

		};

		this.getObject = function () { // retaining this method for backward compatibility

			return camera;

		};

		this.getDirection = function () {

			const direction = new Vector3( 0, 0, - 1 );

			return function ( v ) {

				return v.copy( direction ).applyQuaternion( camera.quaternion );

			};

		}();

		this.moveForward = function ( distance ) {

			// move forward parallel to the xz-plane
			// assumes camera.up is y-up

			_vector.setFromMatrixColumn( camera.matrix, 0 );

			_vector.crossVectors( camera.up, _vector );

			camera.position.addScaledVector( _vector, distance );

		};

		this.moveRight = function ( distance ) {

			_vector.setFromMatrixColumn( camera.matrix, 0 );

			camera.position.addScaledVector( _vector, distance );

		};

		this.lock = function () {

			this.domElement.requestPointerLock();

		};

		this.unlock = function () {

			scope.domElement.ownerDocument.exitPointerLock();

		};

		this.connect();

	}

}





let player = {
  height: 0.5,
  turnSpeed: 0.1,
  speed: 0.1,
  jumpHeight: 0.2,
  gravity: 0.01,
  velocity: 0,
  jumps: false
};

/////////////////////building a terrain ///////////////////////

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

//automatic resize
window.addEventListener("resize", () => {
  let width = window.innerWidth;
  let height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

//camera position
camera.position.set(0, player.height, -5);
camera.lookAt(new THREE.Vector3(0, player.height, 0));

//box
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = false;
cube.position.y = 0.8;
scene.add(cube);

//plane
const planeGeo = new THREE.PlaneGeometry(2000, 2000, 8, 8);
const planeMat = new THREE.MeshPhongMaterial({ color: 0x808080 });
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.receiveShadow = true;
scene.add(plane);
plane.rotateX(-Math.PI * 0.5);

//lights
const light = new THREE.PointLight(0xffffff, 1);
const light1 = new THREE.DirectionalLight(0xffffff, 1);
light.castShadow = true;
light1.castShadow = true;
light.position.set(0, 3, 0);
light1.position.set(0, 0, -5);
scene.add(light);
scene.add(light1);

const mouseControls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener(
  "click",
  () => {
    mouseControls.lock();
  },
  false
);

///////////////////keyboard controls////////////////////////////

const keysDown = {
  "KeyW": 0,
  "KeyA": 0,
  "KeyS": 0,
  "KeyD": 0,  
}

document.addEventListener("keydown", ({ code }) => {
  keysDown[code] = 1;
});
document.addEventListener("keyup", ({ code }) => {
  keysDown[code] = 0;
});

function updateControls() {
  const forwardDirection = keysDown["KeyW"] - keysDown["KeyS"]
  const rightDirection = keysDown["KeyD"] - keysDown["KeyA"]
  mouseControls.moveForward(forwardDirection * 0.05)
  mouseControls.moveRight(rightDirection * 0.05)
}

////////main animation function
function animate() {
  requestAnimationFrame(animate);
  updateControls();
  renderer.render(scene, camera);
}

animate();

