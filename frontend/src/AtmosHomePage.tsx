import { useMemo, useState, useRef, type CSSProperties } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Icosahedron, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import "./AtmosHomePage.css";

function PrimaryButton({ onClick, children }: { onClick?: () => void; children: string }) {
  return (
    <button className="btn-primary" onClick={onClick}>
      {children}
    </button>
  );
}

function IntelIndicator({ label, value, position, danger = false }: { label: string, value: string, position: CSSProperties, danger?: boolean }) {
  return (
    <div className={`intel-indicator ${danger ? 'danger' : ''}`} style={position}>
      <span className="intel-label">{label}</span>
      <strong className="intel-value">{value}</strong>
    </div>
  );
}

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
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { setHover(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); setActive(!active); }}
    >
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshBasicMaterial color={active ? "#ffffff" : hovered ? "#a2baf5" : "#7da0ff"} />
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

function ThreatSphere3D() {
  return (
    <div className="threat-sphere-container">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
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

import { AnalyzePanel, CasesPanel, AttackGraphPanel, IOCsPanel, ReportsPanel } from "./Panels";

export function AtmosHomePage() {
  const [activeTab, setActiveTab] = useState("HOME");

  const sparks = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        delay: `${(i % 8) * 0.35}s`,
      })),
    []
  );

  const navItems = ["ANALYZE", "CASES", "ATTACK GRAPH", "IOCs", "REPORTS"];

  return (
    <div className="atmos single-viewport">
      <header className="nav">
        <a className="wordmark" href="#top" onClick={(e) => { e.preventDefault(); setActiveTab("HOME"); }}>
          ESecure
        </a>
        <div className="nav-center">
          {navItems.map(item => (
            <button 
              key={item} 
              className={`nav-btn ${activeTab === item ? 'active' : ''}`}
              onClick={() => setActiveTab(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <span className="status">
            <i />
            System active
          </span>
          <PrimaryButton onClick={() => setActiveTab("ANALYZE")}>NEW SCAN</PrimaryButton>
        </div>
      </header>

      <section className="hero full-height" id="top">
        <ThreatSphere3D />
        
        <div className="hero-glow" />
        {sparks.map((spark, i) => (
          <span
            key={i}
            className="spark"
            style={{ left: spark.left, top: spark.top, animationDelay: spark.delay } as CSSProperties}
          />
        ))}

        {/* Floating Intel Indicators */}
        <IntelIndicator label="THREAT SCORE" value="98/100" position={{ top: "22%", left: "6%" }} danger />
        <IntelIndicator label="AUTH PROTOCOLS" value="SPF/DKIM: FAIL" position={{ top: "35%", right: "6%" }} danger />
        <IntelIndicator label="IOC DETECTED" value="12" position={{ bottom: "28%", left: "8%" }} danger />
        <IntelIndicator label="CAMPAIGN CORRELATED" value="APT-29" position={{ bottom: "20%", right: "8%" }} />
        <IntelIndicator label="FORENSIC STATUS" value="READY" position={{ top: "12%", right: "12%" }} />

        <div className="hero-content">
          {activeTab === "HOME" && (
            <>
              <p className="eyebrow">AI-POWERED CYBER FORENSICS</p>
              <h1 className="hero-logo">
                DETECT.<br />
                TRACE.<br />
                PROTECT.
              </h1>
              <p className="hero-supporting">AI-powered email threat detection, cyber forensics &amp; threat intelligence.</p>
              <div className="hero-ctas">
                <PrimaryButton onClick={() => setActiveTab("ANALYZE")}>ANALYZE AN EMAIL</PrimaryButton>
                <button className="btn-secondary" onClick={() => setActiveTab("CASES")}>EXPLORE PLATFORM</button>
              </div>
              <p className="hero-small-text">From suspicious email to actionable evidence.</p>
            </>
          )}

          {activeTab === "ANALYZE" && <AnalyzePanel />}
          {activeTab === "CASES" && <CasesPanel />}
          {activeTab === "ATTACK GRAPH" && <AttackGraphPanel />}
          {activeTab === "IOCs" && <IOCsPanel />}
          {activeTab === "REPORTS" && <ReportsPanel />}
        </div>
      </section>
    </div>
  );
}
