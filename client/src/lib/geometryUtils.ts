import * as THREE from "three";

export const createGeometryFromDescription = (description: string): THREE.Mesh | null => {
  const lowerDesc = description.toLowerCase();
  
  // Simple geometry mapping - this will be enhanced by AI
  if (lowerDesc.includes("lập phương") || lowerDesc.includes("cube")) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.8
    });
    return new THREE.Mesh(geometry, material);
  }
  
  if (lowerDesc.includes("cầu") || lowerDesc.includes("sphere")) {
    const geometry = new THREE.SphereGeometry(1.5, 32, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x059669,
      transparent: true,
      opacity: 0.8
    });
    return new THREE.Mesh(geometry, material);
  }
  
  if (lowerDesc.includes("trụ") || lowerDesc.includes("cylinder")) {
    const geometry = new THREE.CylinderGeometry(1, 1, 3, 32);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xdc2626,
      transparent: true,
      opacity: 0.8
    });
    return new THREE.Mesh(geometry, material);
  }
  
  if (lowerDesc.includes("nón") || lowerDesc.includes("cone")) {
    const geometry = new THREE.ConeGeometry(1.5, 3, 32);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xd97706,
      transparent: true,
      opacity: 0.8
    });
    return new THREE.Mesh(geometry, material);
  }
  
  // Default fallback
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshPhongMaterial({ 
    color: 0x6b7280,
    transparent: true,
    opacity: 0.8
  });
  return new THREE.Mesh(geometry, material);
};

export const getGeometryInfo = (description: string) => {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes("lập phương") || lowerDesc.includes("cube")) {
    return {
      type: "Hình lập phương",
      properties: {
        "Cạnh": "2 đơn vị",
        "Diện tích toàn phần": "24 đơn vị²",
        "Thể tích": "8 đơn vị³"
      },
      formulas: [
        { name: "Diện tích toàn phần", formula: "S = 6a²" },
        { name: "Thể tích", formula: "V = a³" }
      ]
    };
  }
  
  if (lowerDesc.includes("cầu") || lowerDesc.includes("sphere")) {
    return {
      type: "Hình cầu",
      properties: {
        "Bán kính": "1.5 đơn vị",
        "Diện tích mặt cầu": "28.27 đơn vị²",
        "Thể tích": "14.14 đơn vị³"
      },
      formulas: [
        { name: "Diện tích mặt cầu", formula: "S = 4πr²" },
        { name: "Thể tích", formula: "V = (4/3)πr³" }
      ]
    };
  }
  
  return {
    type: "Hình không gian",
    properties: {},
    formulas: []
  };
};
