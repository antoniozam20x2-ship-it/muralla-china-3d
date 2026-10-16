import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const canvas=document.getElementById('escena'),overlay=document.getElementById('carga'),hint=document.getElementById('hint'),reset=document.getElementById('reset');
if(matchMedia('(hover: none)').matches)hint.textContent='Arrastra para girar · pellizca para acercar';
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true})}catch(e){overlay.innerHTML='<p class="err">Sin WebGL. Usa Chrome o Safari actualizados.</p>';throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const FONDO=0x1b2430,scene=new THREE.Scene();
scene.background=bg();scene.fog=new THREE.Fog(0x9fbdd0,60,230);
function bg(){const c=document.createElement('canvas');c.width=8;c.height=512;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#5a86ab');gr.addColorStop(.5,'#93b4c9');gr.addColorStop(1,'#cfd9c4');g.fillStyle=gr;g.fillRect(0,0,8,512);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const MIRA=new THREE.Vector3(8,10,0),camera=new THREE.PerspectiveCamera(38,1,.1,400);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.copy(MIRA);controls.enableDamping=true;controls.dampingFactor=.06;controls.enablePan=false;controls.minPolarAngle=.1;controls.maxPolarAngle=1.5;
const V={ancha:{dir:new THREE.Vector3(.25,.42,.87).normalize(),fov:38,ancho:64,alto:24,margen:1.32},vertical:{dir:new THREE.Vector3(-.62,.34,.71).normalize(),fov:44,ancho:44,alto:30,margen:1.16}};
let vista=V.ancha,dist=40;
// luces
const key=new THREE.DirectionalLight(0xfff2dc,2.4);key.position.set(30,50,20);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-45;key.shadow.camera.right=45;key.shadow.camera.top=45;key.shadow.camera.bottom=-45;key.shadow.camera.far=140;key.shadow.bias=-.0007;key.shadow.normalBias=.03;scene.add(key);
scene.add(new THREE.HemisphereLight(0xbcd7ee,0x3d4a34,.65));
const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose();
// suelo verde
const suelo=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:0x6e8f5c,roughness:1,flatShading:true}));
suelo.rotation.x=-Math.PI/2;suelo.receiveShadow=true;scene.add(suelo);
// materiales
const piedra=new THREE.MeshStandardMaterial({color:0xb9a68a,roughness:.92,flatShading:true});
const piedraSup=new THREE.MeshStandardMaterial({color:0xa08d72,roughness:.95,flatShading:true});
const piedraB=new THREE.MeshStandardMaterial({color:0xc7b596,roughness:.9,flatShading:true});
const teja=new THREE.MeshStandardMaterial({color:0x6b4a3a,roughness:.8,flatShading:true});
const montana=new THREE.MeshStandardMaterial({color:0x5c7d4e,roughness:1,flatShading:true});
const montanaLejana=new THREE.MeshStandardMaterial({color:0x76918a,roughness:1,flatShading:true});
const g=new THREE.Group();scene.add(g);
function caja(w,h,d,x,y,z,mat,ry){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);if(ry)o.rotation.y=ry;o.castShadow=true;o.receiveShadow=true;g.add(o);return o}
// --- muralla: recorre la ruta ---
const ruta=[[-60,3],[-34,7],[-8,5],[16,9],[40,6],[62,10],[82,6]];
const ALT=7.2,GROSOR=3.2;
function punto(t){const n=ruta.length-1;const f=t*n;const i=Math.min(Math.floor(f),n-1);let u=f-i;u=u*u*(3-2*u);const A=ruta[i],B=ruta[i+1];return{ x:A[0]+(B[0]-A[0])*u, y:A[1]+(B[1]-A[1])*u, ang:Math.atan2(B[1]-A[1],B[0]-A[0]) }}
const SEG=64;
for(let i=0;i<SEG;i++){
  const t0=i/SEG,t1=(i+1)/SEG;
  const A=punto(t0),B=punto(t1);
  const cx=(A.x+B.x)/2,cy=(A.y+B.y)/2;
  const len=Math.hypot(B.x-A.x,B.y-A.y)*1.06;
  const ang=Math.atan2(B.y-A.y,B.x-A.x);
  const grupo=new THREE.Group();
  // cuerpo
  const cuerpo=new THREE.Mesh(new THREE.BoxGeometry(len,ALT,GROSOR),i%2?piedra:piedraSup);
  cuerpo.position.y=ALT/2;cuerpo.castShadow=true;cuerpo.receiveShadow=true;grupo.add(cuerpo);
  // parapeto superior (dos_almenas)
  [-1,1].forEach(s=>{
    const pp=new THREE.Mesh(new THREE.BoxGeometry(len,1.1,GROSOR*.42),piedraB);
    pp.position.set(0,ALT+0.55,s*(GROSOR/2-GROSOR*.21));pp.castShadow=true;grupo.add(pp);
  });
  // walkway central con adoquines
  const walk=new THREE.Mesh(new THREE.BoxGeometry(len,0.16,GROSOR*0.5),piedraSup);
  walk.position.y=ALT+0.08;grupo.add(walk);
  // almenas (merlons) alternadas sobre el parapeto
  const nM=Math.max(2,Math.round(len/1.5));
  for(let k=0;k<nM;k++){
    if(k%2)continue;
    [-1,1].forEach(s=>{
      const mer=new THREE.Mesh(new THREE.BoxGeometry(len/nM*.9,0.9,GROSOR*.42),piedraB);
      mer.position.set(-len/2+len*(k+0.5)/nM,ALT+1.55,s*(GROSOR/2-GROSOR*.21));
      mer.castShadow=true;grupo.add(mer);
    });
  }
  grupo.position.set(cx,cy,0);grupo.rotation.z=ang;
  g.add(grupo);
}
// --- torres de vigilancia ---
[0.06,0.26,0.5,0.72,0.92].forEach((t,idx)=>{
  const P=punto(t);
  const TW=5.2;
  const torre=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(TW,ALT+2,TW),piedraSup);
  base.position.y=(ALT+2)/2;base.castShadow=true;base.receiveShadow=true;torre.add(base);
  // remate superior con almenas
  const remate=new THREE.Mesh(new THREE.BoxGeometry(TW+0.5,1.3,TW+0.5),piedraB);
  remate.position.y=ALT+2.65;remate.castShadow=true;torre.add(remate);
  for(let k=0;k<4;k++)for(let j=0;j<4;j++){
    if(k!==0&&k!==3&&j!==0&&j!==3)continue;
    if((k+j)%2)continue;
    const m=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.9,1.1),piedraB);
    m.position.set(-TW/2+k*1.5,ALT+3.75,-TW/2+j*1.5);m.castShadow=true;torre.add(m);
  }
  // techo a dos aguas (pagoda)
  const techo=new THREE.Mesh(new THREE.ConeGeometry(TW*.95,2.4,4),teja);
  techo.rotation.y=Math.PI/4;techo.position.y=ALT+5.3;techo.castShadow=true;torre.add(techo);
  torre.position.set(P.x,P.y,0);
  g.add(torre);
});
// --- colinas por las que corre la muralla ---
function colina(rad,alt,x){const o=new THREE.Mesh(new THREE.ConeGeometry(rad,alt,7),montana);o.position.set(x,alt/2,0);o.receiveShadow=true;g.add(o)}
colina(40,8.5,-34);colina(36,6.5,-8);colina(42,10.5,16);colina(38,7.5,40);colina(44,11.5,62);
// --- montañas de fondo ---
function cono(rad,alt,seg,x,z,mat,yoff){const o=new THREE.Mesh(new THREE.ConeGeometry(rad,alt,seg),mat);o.position.set(x,yoff||alt/2,z);o.castShadow=false;o.receiveShadow=false;g.add(o);return o}
cono(46,34,7,-70,55);cono(38,26,7,-20,70,montanaLejana);cono(52,30,6,40,72);cono(34,22,7,80,58,montanaLejana);
cono(22,15,6,10,-55);cono(26,18,6,-45,-48);cono(30,20,6,90,-40,montanaLejana);
function encuadrar(keep){const t=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);const dV=(vista.alto/2)/t,dH=(vista.ancho/2)/(t*camera.aspect);dist=Math.max(dV,dH)*vista.margen;if(keep){const v=camera.position.clone().sub(MIRA).setLength(dist);camera.position.copy(MIRA).add(v)}else camera.position.copy(vista.dir).multiplyScalar(dist).add(MIRA);controls.minDistance=dist*.35;controls.maxDistance=dist*2.4;controls.update()}
function ajustar(k){const w=innerWidth,h=innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(w,h,false);camera.aspect=w/h;vista=camera.aspect<1?V.vertical:V.ancha;camera.fov=vista.fov;camera.updateProjectionMatrix();encuadrar(k===undefined?true:k)}
addEventListener('resize',()=>ajustar());addEventListener('orientationchange',()=>ajustar());
reset.addEventListener('click',()=>{vista=camera.aspect<1?V.vertical:V.ancha;camera.position.copy(vista.dir).multiplyScalar(dist).add(MIRA);controls.target.copy(MIRA);controls.update()});
ajustar(false);
let first=true;
(function loop(){requestAnimationFrame(loop);controls.update();renderer.render(scene,camera);if(first){first=false;overlay.classList.add('fuera');setTimeout(()=>overlay.remove(),520)}})();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ajustar()});