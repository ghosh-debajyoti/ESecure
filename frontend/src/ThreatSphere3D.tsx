import React, { useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Icosahedron, OrbitControls, Html } from '@react-three/drei';

const NODE_DATA = [
  { label: "Threat Level", value: "Critical" },
  { label: "IP Address", value: "192.168.1.105" },
  { label: "IOC Detected", value: "Malicious Hash" },
  { label: "AI Analysis", value: "Phishing Attempt" },
  { label: "Forensic Status", value: "Evidence Collected" },
  { label: "Protocol", value: "SMTP" },
  { label: "Signature", value: "APT-29" },
  { label: "Risk Score", value: "98/100" },
];

const nodeGeometry = new THREE.SphereGeometry(0.06, 16, 16);
const materialDefault = new THREE.MeshBasicMaterial({ color: "#7da0ff" });
const materialHover = new THREE.MeshBasicMaterial({ color: "#a2baf5" });
const materialActive = new THREE.MeshBasicMaterial({ color: "#ffffff" });

function InteractiveNode({ position, data }: { position: THREE.Vector3, data: any }) {
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetScale = active ? 2.5 : hovered ? 1.8 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
  });

  return (
    <mesh 
      ref={meshRef}
      position={position} 
      geometry={nodeGeometry}
      material={active ? materialActive : hovered ? materialHover : materialDefault}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { setHover(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); setActive(!active); }}
    >
      {hovered && (
        <Html distanceFactor={12} center zIndexRange={[100, 0]}>
          <div className="node-tooltip">
            <span className="tooltip-label">{data.label}</span>
            <span className="tooltip-value">{data.value}</span>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function ThreatObject() {
  const meshRef = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    const n = 35; // 35 nodes
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      pts.push(new THREE.Vector3(x * 2.7, y * 2.7, z * 2.7));
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle tilt based on pointer
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      
      meshRef.current.rotation.y += (targetX - meshRef.current.rotation.y) * 0.05;
      meshRef.current.rotation.x += (-targetY - meshRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Icosahedron args={[2.5, 1]}>
          <meshPhysicalMaterial 
            color="#050a15" 
            metalness={1} 
            roughness={0.2} 
            transmission={0.9} 
            thickness={2} 
            envMapIntensity={2}
            clearcoat={1}
          />
        </Icosahedron>
        
        {/* Network layer */}
        <Icosahedron args={[2.7, 1]}>
          <meshBasicMaterial color="#3156c4" wireframe transparent opacity={0.3} />
        </Icosahedron>
        
        {/* Glowing Core */}
        <Icosahedron args={[1.2, 2]}>
          <meshBasicMaterial color="#7da0ff" transparent opacity={0.1} wireframe />
        </Icosahedron>

        {/* Interactive Nodes scattered on the network layer */}
        {nodes.map((pos, i) => (
          <InteractiveNode key={i} position={pos} data={NODE_DATA[i % NODE_DATA.length]} />
        ))}
      </Float>
    </group>
  );
}

export default function ThreatSphere3D({ isBackground = false, onReady }: { isBackground?: boolean, onReady?: () => void }) {
  return (
    <div className={`threat-sphere-container ${isBackground ? 'bg-mode' : ''}`}>
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 45 }} 
        style={isBackground ? { pointerEvents: 'none' } : {}}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        onCreated={() => onReady && onReady()}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#7da0ff" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#ff3b30" />
        <ThreatObject />
        <Environment preset="city" />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableDamping={true} 
          dampingFactor={0.05} 
          minDistance={5} 
          maxDistance={12} 
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
