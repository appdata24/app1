import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Slider } from "./ui/slider";
import { useGeometry } from "../lib/stores/useGeometry";
// @ts-ignore
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import * as THREE from 'three';

export default function GeometryControls() {
  const [inputText, setInputText] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(10);
  const [currentDescription, setCurrentDescription] = useState("");
  const { geometry, setGeometry, setIsLoading, setError, labelScale, setLabelScale, selectedElements, clearSelection, editMode, setEditMode, updateEdge, updateAngle } = useGeometry();
  const [newEdgeLength, setNewEdgeLength] = useState<string>("");
  const [newAngleValue, setNewAngleValue] = useState<string>("");

  const getVertexPosition = (label: string): THREE.Vector3 | null => {
    const v = geometry?.vertices?.find((vx: any) => vx.label === label)
      || geometry?.userVertices?.find((vx: any) => vx.label === label);
    if (!v) return null;
    return new THREE.Vector3(...v.position);
  };

  const setVertexPosition = (label: string, pos: THREE.Vector3) => {
    if (!geometry) return;
    const updatedVertices = (geometry.vertices || []).map((vx: any) =>
      vx.label === label ? { ...vx, position: [pos.x, pos.y, pos.z] as [number, number, number] } : vx
    );
    const updatedUserVertices = (geometry.userVertices || []).map((vx: any) =>
      vx.label === label ? { ...vx, position: [pos.x, pos.y, pos.z] as [number, number, number] } : vx
    );
    setGeometry({ ...geometry, vertices: updatedVertices, userVertices: updatedUserVertices });
  };

  const recomputeEdges = () => {
    if (!geometry?.edges) return;
    const updated = geometry.edges.map((e: any) => {
      const p1 = getVertexPosition(e.from);
      const p2 = getVertexPosition(e.to);
      if (!p1 || !p2) return e;
      const len = p1.clone().distanceTo(p2);
      return { ...e, length: parseFloat(len.toFixed(4)) };
    });
    setGeometry({ ...geometry, edges: updated });
  };

  const recomputeAngles = () => {
    if (!geometry?.angles) return;
    const updated = geometry.angles.map((a: any) => {
      const [vA, vB, vC] = a.vertices;
      const pA = getVertexPosition(vA);
      const pB = getVertexPosition(vB);
      const pC = getVertexPosition(vC);
      if (!pA || !pB || !pC) return a;
      const v1 = pA.clone().sub(pB).normalize();
      const v2 = pC.clone().sub(pB).normalize();
      const dot = THREE.MathUtils.clamp(v1.dot(v2), -1, 1);
      const angleDeg = THREE.MathUtils.radToDeg(Math.acos(dot));
      return { ...a, value: parseFloat(angleDeg.toFixed(2)) };
    });
    setGeometry({ ...geometry, angles: updated });
  };

  const edgeNameFromId = (id: string) => {
    const [a, b] = id.split('-');
    return [`${a}${b}`, `${b}${a}`];
  };

  const selectedEdgeId = useMemo(() => selectedElements.length > 0 ? selectedElements[0] : null, [selectedElements]);
  const selectedAngleInfo = useMemo(() => {
    if (selectedElements.length !== 2) return null;
    const [e1, e2] = selectedElements;
    const [a1, b1] = e1.split('-');
    const [a2, b2] = e2.split('-');
    const common = [a1, b1].find(v => v === a2 || v === b2);
    if (!common) return null;
    const other1 = a1 === common ? b1 : a1;
    const other2 = a2 === common ? b2 : a2;
    const label = `${other1}${common}${other2}`;
    return { label, common, other1, other2 };
  }, [selectedElements]);

  const applyEdgeLengthChange = () => {
    if (!geometry || !selectedEdgeId) return;
    const value = parseFloat(newEdgeLength);
    if (!isFinite(value) || value <= 0) {
      setError('Vui lòng nhập chiều dài hợp lệ (> 0).');
      return;
    }

    const [from, to] = selectedEdgeId.split('-');
    const pFrom = getVertexPosition(from);
    const pTo = getVertexPosition(to);
    if (!pFrom || !pTo) return;
    const dir = pTo.clone().sub(pFrom);
    const currentLen = dir.length();
    if (currentLen === 0) return;
    dir.normalize();
    const newPosTo = pFrom.clone().add(dir.multiplyScalar(value));
    // Xây dựng map vị trí cho cả vertices và userVertices, áp dụng vị trí mới cho `to`
    const posMap = new Map<string, THREE.Vector3>();
    (geometry.vertices || []).forEach((vx: any) => posMap.set(vx.label, new THREE.Vector3(...vx.position)));
    (geometry.userVertices || []).forEach((vx: any) => posMap.set(vx.label, new THREE.Vector3(...vx.position)));
    posMap.set(to, newPosTo);

    // Tách lại thành mảng vertices và userVertices
    const updatedVertices = (geometry.vertices || []).map((vx: any) =>
      vx.label === to ? { ...vx, position: [newPosTo.x, newPosTo.y, newPosTo.z] as [number, number, number] } : vx
    );
    const updatedUserVertices = (geometry.userVertices || []).map((vx: any) =>
      vx.label === to ? { ...vx, position: [newPosTo.x, newPosTo.y, newPosTo.z] as [number, number, number] } : vx
    );

    // Tính lại chiều dài cạnh và góc bằng posMap hợp nhất
    const updatedEdges = (geometry.edges || []).map((e: any) => {
      const p1 = posMap.get(e.from);
      const p2 = posMap.get(e.to);
      if (!p1 || !p2) return e;
      const len = p1.clone().distanceTo(p2);
      return { ...e, length: parseFloat(len.toFixed(4)) };
    });

    const updatedAngles = (geometry.angles || []).map((a: any) => {
      const [vA, vB, vC] = a.vertices;
      const pA = posMap.get(vA);
      const pB = posMap.get(vB);
      const pC = posMap.get(vC);
      if (!pA || !pB || !pC) return a;
      const v1 = pA.clone().sub(pB).normalize();
      const v2 = pC.clone().sub(pB).normalize();
      const dot = THREE.MathUtils.clamp(v1.dot(v2), -1, 1);
      const angleDeg = THREE.MathUtils.radToDeg(Math.acos(dot));
      return { ...a, value: parseFloat(angleDeg.toFixed(2)) };
    });

    setGeometry({ ...geometry, vertices: updatedVertices, userVertices: updatedUserVertices, edges: updatedEdges, angles: updatedAngles });
    setEditMode(null);
    setError(null);
    setNewEdgeLength("");
  };

  const applyAngleChange = () => {
    if (!geometry || !selectedAngleInfo) return;
    const value = parseFloat(newAngleValue);
    if (!isFinite(value) || value <= 0 || value >= 180) {
      setError('Vui lòng nhập góc hợp lệ (0 < góc < 180).');
      return;
    }
    const { common, other1, other2 } = selectedAngleInfo;
    const pCommon = getVertexPosition(common);
    const p1 = getVertexPosition(other1);
    const p2 = getVertexPosition(other2);
    if (!pCommon || !p1 || !p2) return;

    const v1 = p1.clone().sub(pCommon);
    const v2 = p2.clone().sub(pCommon);
    const len2 = v2.length();
    if (v1.length() === 0 || len2 === 0) return;
    const current = THREE.MathUtils.radToDeg(
      Math.acos(THREE.MathUtils.clamp(v1.clone().normalize().dot(v2.clone().normalize()), -1, 1))
    );
    const delta = THREE.MathUtils.degToRad(value - current);

    let axis = new THREE.Vector3().crossVectors(v1, v2);
    if (axis.length() === 0) {
      axis = new THREE.Vector3(0, 1, 0).cross(v2);
      if (axis.length() === 0) axis = new THREE.Vector3(1, 0, 0).cross(v2);
    }
    axis.normalize();

    const v2Rot = v2.clone().applyAxisAngle(axis, delta);
    const newP2 = pCommon.clone().add(v2Rot.clone().setLength(len2));
    // Xây dựng map vị trí hợp nhất cho cả vertices và userVertices, áp dụng vị trí mới cho other2
    const posMap = new Map<string, THREE.Vector3>();
    (geometry.vertices || []).forEach((vx: any) => posMap.set(vx.label, new THREE.Vector3(...vx.position)));
    (geometry.userVertices || []).forEach((vx: any) => posMap.set(vx.label, new THREE.Vector3(...vx.position)));
    posMap.set(other2, newP2);

    const updatedVertices = (geometry.vertices || []).map((vx: any) =>
      vx.label === other2 ? { ...vx, position: [newP2.x, newP2.y, newP2.z] as [number, number, number] } : vx
    );
    const updatedUserVertices = (geometry.userVertices || []).map((vx: any) =>
      vx.label === other2 ? { ...vx, position: [newP2.x, newP2.y, newP2.z] as [number, number, number] } : vx
    );

    const updatedEdges = (geometry.edges || []).map((e: any) => {
      const pA = posMap.get(e.from);
      const pB = posMap.get(e.to);
      if (!pA || !pB) return e;
      const len = pA.distanceTo(pB);
      return { ...e, length: parseFloat(len.toFixed(4)) };
    });

    const updatedAngles = (geometry.angles || []).map((a: any) => {
      const [vA, vB, vC] = a.vertices;
      const pA2 = posMap.get(vA);
      const pB2 = posMap.get(vB);
      const pC2 = posMap.get(vC);
      if (!pA2 || !pB2 || !pC2) return a;
      const vv1 = pA2.clone().sub(pB2).normalize();
      const vv2 = pC2.clone().sub(pB2).normalize();
      const dot2 = THREE.MathUtils.clamp(vv1.dot(vv2), -1, 1);
      const angleDeg2 = THREE.MathUtils.radToDeg(Math.acos(dot2));
      return { ...a, value: parseFloat(angleDeg2.toFixed(2)) };
    });

    setGeometry({ ...geometry, vertices: updatedVertices, userVertices: updatedUserVertices, edges: updatedEdges, angles: updatedAngles });
    setEditMode(null);
    setError(null);
    setNewAngleValue("");
  };
  
  // Convert formula to LaTeX
  const toLatex = (formula: string) => {
    return formula
      // Replace Vietnamese characters in subscripts/superscripts with text mode
      .replace(/_([^{}\s]+)/g, (match, p1) => {
        // If contains Vietnamese chars, wrap in \text{}
        if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(p1)) {
          return `_{\\text{${p1}}}`;
        }
        return `_{${p1}}`;
      })
      .replace(/×/g, '\\times')
      .replace(/π/g, '\\pi')
      .replace(/√(\d+)/g, '\\sqrt{$1}')
      .replace(/√/g, '\\sqrt')
      .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
      .replace(/\^(\d+)/g, '^{$1}')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3');
  };

  const generateGeometry = useMutation({
    mutationFn: async (description: string) => {
      console.log(`[Lần thử ${retryCount + 1}/${maxRetries}] Gửi yêu cầu tạo hình:`, description);
      
      try {
        const response = await fetch("/api/generate-geometry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error:", errorText);
          
          // Parse error to check if it's a JSON error
          const isJsonError = errorText.includes("JSON") || errorText.includes("Expected property");
          const isRateLimit = response.status === 429 || errorText.includes("rate");
          
          throw new Error(JSON.stringify({
            status: response.status,
            message: errorText,
            isJsonError,
            isRateLimit
          }));
        }
        
        const data = await response.json();
        console.log("✓ Dữ liệu nhận được thành công:", data);
        return data;
      } catch (error: any) {
        console.error("Lỗi khi tạo hình:", error);
        throw error;
      }
    },
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      console.log("✓ Thành công sau", retryCount + 1, "lần thử!");
      setGeometry(data);
      setIsLoading(false);
      setRetryCount(0); // Reset counter
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      
      // Parse error to check if we should retry
      let shouldRetry = false;
      let isRateLimit = false;
      
      try {
        const errorData = JSON.parse(error?.message || "{}");
        shouldRetry = errorData.isJsonError && !errorData.isRateLimit;
        isRateLimit = errorData.isRateLimit;
      } catch {
        // If can't parse, check message directly
        const errorMsg = error?.message || "";
        shouldRetry = errorMsg.includes("JSON") || errorMsg.includes("Expected property") || errorMsg.includes("Invalid AI response");
        isRateLimit = errorMsg.includes("429") || errorMsg.includes("rate");
      }
      
      // Check if we should retry
      if (shouldRetry && retryCount < maxRetries) {
        // Auto retry - use useEffect or setTimeout outside of render
        const newCount = retryCount + 1;
        console.log(`⟳ Lỗi JSON, tự động thử lại (${newCount}/${maxRetries})...`);
        setError(`Đang thử lại... (lần ${newCount}/${maxRetries})`);
        setRetryCount(newCount);
        
        // Retry after short delay (outside render cycle)
        setTimeout(() => {
          if (currentDescription) {
            generateGeometry.mutate(currentDescription);
          }
        }, 1000);
      } else {
        // Stop retrying
        if (retryCount >= maxRetries) {
          setError(`Đã thử ${maxRetries} lần nhưng AI vẫn trả về lỗi. Vui lòng thử lại sau.`);
        } else if (isRateLimit) {
          setError("AI đang bị giới hạn. Vui lòng đợi 30-60 giây rồi thử lại.");
        } else {
          const errorMessage = error?.message || "Không thể tạo hình 3D. Vui lòng thử lại.";
          setError(errorMessage);
        }
        setIsLoading(false);
        setRetryCount(0);
      }
    },
  });

  // Đã gỡ tính năng tính khoảng cách tự động

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      setRetryCount(0); // Reset counter before starting
      setCurrentDescription(inputText.trim()); // Save for retries
      generateGeometry.mutate(inputText.trim());
    }
  };


  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tạo Hình 3D</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="geometry-input">Mô tả hình không gian:</Label>
              <Input
                id="geometry-input"
                type="text"
                placeholder="Ví dụ: hình lập phương, hình chóp tứ giác, hình trụ..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={generateGeometry.isPending}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full mt-4"
              disabled={!inputText.trim() || generateGeometry.isPending}
            >
              {generateGeometry.isPending 
                ? retryCount > 0 
                  ? `Đang thử lại... (${retryCount}/${maxRetries})` 
                  : "Đang tạo..." 
                : "Tạo Hình 3D"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {geometry && (
        <>
          {/* Connect Vertices (Create Edge) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nối điểm thành cạnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  onClick={() => { setEditMode('connect-vertices'); }}
                  variant={editMode === 'connect-vertices' ? 'default' : 'outline'}
                  className="w-full text-sm"
                >
                  {editMode === 'connect-vertices' ? 'Đang chọn 2 điểm để nối' : 'Bật chế độ Nối điểm'}
                </Button>
                {editMode === 'connect-vertices' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-700">Click chọn 2 điểm bất kỳ (ví dụ: A và C) để tạo cạnh AC ({selectedElements.length}/2)</p>
                    {selectedElements.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Đã chọn: {selectedElements.join(', ')}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        onClick={() => { setEditMode(null); clearSelection(); }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Points */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thêm điểm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => { setEditMode('add-vertex-free'); clearSelection(); }}
                  variant={editMode === 'add-vertex-free' ? 'default' : 'outline'}
                  className="w-full text-sm"
                >
                  {editMode === 'add-vertex-free' ? 'Đang thêm điểm Tự Do' : 'Tự Do'}
                </Button>
                <Button
                  onClick={() => { setEditMode('add-vertex-on-edge'); clearSelection(); }}
                  variant={editMode === 'add-vertex-on-edge' ? 'default' : 'outline'}
                  className="w-full text-sm"
                >
                  {editMode === 'add-vertex-on-edge' ? 'Đang thêm điểm Trên Cạnh' : 'Trên Cạnh'}
                </Button>
              </div>
              {(editMode === 'add-vertex-free' || editMode === 'add-vertex-on-edge') && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-xs text-blue-700">
                    {editMode === 'add-vertex-free' && 'Double-click trên lưới để thêm điểm Tự Do.'}
                    {editMode === 'add-vertex-on-edge' && 'Double-click vào cạnh để thêm điểm Trên Cạnh.'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => { setEditMode(null); clearSelection(); }}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              )}

              {geometry.userVertices && geometry.userVertices.length > 0 && (
                <div className="text-xs text-gray-700 space-y-1 mt-2">
                  <p className="font-semibold">Các điểm đã thêm:</p>
                  <div className="flex flex-wrap gap-2">
                    {geometry.userVertices.map((v:any, idx:number) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded">{v.label}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Points */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Xóa điểm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  onClick={() => { setEditMode('delete-vertex'); clearSelection(); }}
                  variant={editMode === 'delete-vertex' ? 'default' : 'outline'}
                  className="w-full text-sm"
                >
                  {editMode === 'delete-vertex' ? 'Đang xóa điểm đã thêm' : 'Bật chế độ Xóa điểm'}
                </Button>
                {editMode === 'delete-vertex' && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-700">Click vào điểm Pn đã thêm để xóa.</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        onClick={() => { setEditMode(null); clearSelection(); }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin hình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">{geometry.type}</h3>
                <p className="text-sm text-gray-600">{geometry.description}</p>
              </div>
              
              {geometry.properties && (
                <div className="space-y-1">
                  {Object.entries(geometry.properties).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-sm flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {geometry.formulas && geometry.formulas.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold text-gray-700">Công thức:</p>
                  {geometry.formulas.map((formula: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded">
                      <p className="text-xs text-gray-600 mb-1">{formula.name}:</p>
                      <div className="text-center">
                        <BlockMath math={toLatex(formula.formula)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Edit Edge Length */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thay đổi chiều dài cạnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  onClick={() => { setEditMode('edge-length'); }}
                  variant={editMode === 'edge-length' ? 'default' : 'outline'}
                  className="w-full text-sm"
                >
                  {editMode === 'edge-length' ? 'Đang chọn cạnh để chỉnh' : 'Bật chọn cạnh để chỉnh'}
                </Button>
                {editMode === 'edge-length' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-700">Click chọn 1 cạnh ({selectedElements.length}/1)</p>
                    {selectedElements.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Đã chọn: {selectedElements.join(', ')}</p>
                    )}
                  </div>
                )}

                {selectedEdgeId && (
                  <div className="text-xs text-gray-700 space-y-1">
                    <p>Đã chọn: {edgeNameFromId(selectedEdgeId).join(' / ')}</p>
                    {geometry.edges && (
                      <p>
                        Chiều dài hiện tại: {
                          geometry.edges.find((e:any)=> edgeNameFromId(selectedEdgeId).includes(e.name))?.length ?? '—'
                        }
                      </p>
                    )}
                  </div>
                )}

                <Input
                  type="number"
                  placeholder="Nhập chiều dài mới (m)"
                  value={newEdgeLength}
                  onChange={(e)=>setNewEdgeLength(e.target.value)}
                  disabled={!selectedEdgeId}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={applyEdgeLengthChange}
                    disabled={!selectedEdgeId || !newEdgeLength}
                  >
                    Áp dụng
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setEditMode(null); setNewEdgeLength(''); clearSelection(); }}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Angle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thay đổi góc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  onClick={() => { setEditMode('angle'); }}
                  variant={editMode === 'angle' ? 'default' : 'outline'}
                  className="w-full text-sm"
                >
                  {editMode === 'angle' ? 'Đang chọn 2 cạnh tạo góc' : 'Bật chọn 2 cạnh tạo góc'}
                </Button>
                {editMode === 'angle' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-700">Click chọn 2 cạnh có chung điểm ({selectedElements.length}/2)</p>
                    {selectedElements.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Đã chọn: {selectedElements.join(', ')}</p>
                    )}
                  </div>
                )}

                {selectedAngleInfo && (
                  <div className="text-xs text-gray-700 space-y-1">
                    <p>Góc được chọn: {selectedAngleInfo.label}</p>
                    {geometry.angles && (
                      <p>
                        Giá trị hiện tại: {
                          geometry.angles.find((a:any)=> {
                            const v = a.vertices;
                            return (v[0] === selectedAngleInfo.other1 && v[1] === selectedAngleInfo.common && v[2] === selectedAngleInfo.other2) ||
                                   (v[0] === selectedAngleInfo.other2 && v[1] === selectedAngleInfo.common && v[2] === selectedAngleInfo.other1);
                          })?.value ?? '—'
                        }°
                      </p>
                    )}
                  </div>
                )}

                <Input
                  type="number"
                  placeholder="Nhập góc mới (độ)"
                  value={newAngleValue}
                  onChange={(e)=>setNewAngleValue(e.target.value)}
                  disabled={!selectedAngleInfo}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={applyAngleChange}
                    disabled={!selectedAngleInfo || !newAngleValue}
                  >
                    Áp dụng
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setEditMode(null); setNewAngleValue(''); clearSelection(); }}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Điều chỉnh hiển thị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="labelScale" className="text-sm">
                    Kích cỡ điểm & nhãn
                  </Label>
                  <span className="text-sm font-medium">
                    {labelScale.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  id="labelScale"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[labelScale]}
                  onValueChange={(values: number[]) => setLabelScale(values[0])}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Điều khiển</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>Chuột trái:</strong> Xoay góc nhìn</p>
                  <p>• <strong>Chuột phải:</strong> Di chuyển</p>
                  <p>• <strong>Cuộn chuột:</strong> Phóng to/thu nhỏ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
