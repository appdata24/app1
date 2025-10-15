const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'client', 'src', 'components', 'Scene3D.tsx');
let source = fs.readFileSync(filePath, 'utf8');

function replaceInClickableEdge(str) {
  const start = str.indexOf('function ClickableEdge');
  if (start < 0) return str;
  const end = str.indexOf('function ClickableFace', start);
  const block = str.slice(start, end > 0 ? end : str.length);
  const replacedBlock = block.replace(
    'onDoubleClick={() => {}}',
    `onDoubleClick={(e) => {\n        e.stopPropagation();\n        if (editMode === 'add-vertex-on-edge' && onAddUserVertex) {\n          const p0 = new THREE.Vector3(start[0], start[1], start[2]);\n          const p1 = new THREE.Vector3(end[0], end[1], end[2]);\n          const seg = new THREE.Vector3().subVectors(p1, p0);\n          const len2 = seg.lengthSq();\n          if (len2 === 0) return;\n          const t = THREE.MathUtils.clamp(\n            new THREE.Vector3().subVectors(e.point, p0).dot(seg) / len2,\n            0,\n            1\n          );\n          const newPos = new THREE.Vector3().copy(p0).add(seg.multiplyScalar(t));\n          onAddUserVertex([newPos.x, newPos.y, newPos.z]);\n        }\n      }}`
  );
  return str.slice(0, start) + replacedBlock + (end > 0 ? str.slice(end) : '');
}

function addPropsToClickableEdgeUsage(str) {
  const mapStart = str.indexOf('geometryEdges.map');
  if (mapStart < 0) return str;
  const usageStart = str.indexOf('<ClickableEdge', mapStart);
  if (usageStart < 0) return str;
  const before = str.slice(0, usageStart);
  const rest = str.slice(usageStart);
  const injected = rest.replace(
    'onHover={setHoveredElement}',
    `onHover={setHoveredElement}\n          editMode={editMode}\n          onAddUserVertex={(pos) => addUserVertex(pos)}`
  );
  return before + injected;
}

function replaceGridDoubleClick(str) {
  return str.replace(
    /fadeStrength={1}\n\s*onDoubleClick=\(\) => \{\}\n\s*\//,
    (m) =>
      m.replace(
        'onDoubleClick=() => {}',
        `onDoubleClick={(e) => {\n          e.stopPropagation();\n          if (editMode === 'add-vertex-free') {\n            const p = e.point;\n            addUserVertex([p.x, p.y, p.z]);\n          }\n        }}`
      )
  );
}

function replacePlaneDoubleClick(str) {
  return str.replace(
    /rotation=\{\[-Math\.PI \/ 2, 0, 0\]\}\n\s*onDoubleClick=\(\) => \{\}/,
    `rotation={[-Math.PI / 2, 0, 0]}\n        onDoubleClick={(e) => {\n          e.stopPropagation();\n          if (editMode === 'add-vertex-free') {\n            const p = e.point;\n            addUserVertex([p.x, p.y, p.z]);\n          }\n        }}`
  );
}

let updated = source;
updated = replaceInClickableEdge(updated);
updated = addPropsToClickableEdgeUsage(updated);
updated = replaceGridDoubleClick(updated);
updated = replacePlaneDoubleClick(updated);

fs.writeFileSync(filePath, updated);
console.log('Patched Scene3D.tsx successfully');