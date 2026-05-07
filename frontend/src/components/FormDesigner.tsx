import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Transformer, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import './FormDesigner.css';

interface TextFieldConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  placeholder?: string;
  name?: string;
}

interface CheckboxConfig {
  id: string;
  x: number;
  y: number;
  size: number;
  checked: boolean;
  label: string;
  name?: string;
}

interface FormDesignerData {
  version: string;
  backgroundImage?: string;
  textFields: TextFieldConfig[];
  checkboxes: CheckboxConfig[];
  stageWidth: number;
  stageHeight: number;
}

interface FormDesignerProps {
  stageWidth?: number;
  stageHeight?: number;
  onSave?: (data: FormDesignerData) => void;
}

const FormDesigner: React.FC<FormDesignerProps> = ({ stageWidth = 800, stageHeight = 600, onSave }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const backgroundLayerRef = useRef<Konva.Layer>(null);
  const uiLayerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<Konva.Image>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'textfield' | 'checkbox' | null>(null);
  const [textFields, setTextFields] = useState<TextFieldConfig[]>([]);
  const [checkboxes, setCheckboxes] = useState<CheckboxConfig[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [mode, setMode] = useState<'select' | 'add-text' | 'add-checkbox'>('select');

  const addTextField = () => {
    const newField: TextFieldConfig = {
      id: `tf-${Date.now()}`,
      x: 50,
      y: 50 + textFields.length * 60,
      width: 200,
      height: 40,
      text: 'Sample Text',
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#000000',
      placeholder: 'Enter text...',
      name: `field_${textFields.length + 1}`,
    };
    setTextFields([...textFields, newField]);
    setMode('select');
  };

  const updateTextField = (id: string, updates: Partial<TextFieldConfig>) => {
    setTextFields(textFields.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteTextField = (id: string) => {
    setTextFields(textFields.filter(f => f.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedType(null);
    }
  };

  const addCheckbox = () => {
    const newCheckbox: CheckboxConfig = {
      id: `cb-${Date.now()}`,
      x: 50,
      y: 150 + checkboxes.length * 50,
      size: 20,
      checked: false,
      label: `Option ${checkboxes.length + 1}`,
      name: `checkbox_${checkboxes.length + 1}`,
    };
    setCheckboxes([...checkboxes, newCheckbox]);
    setMode('select');
  };

  const updateCheckbox = (id: string, updates: Partial<CheckboxConfig>) => {
    setCheckboxes(checkboxes.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCheckbox = (id: string) => {
    setCheckboxes(checkboxes.filter(c => c.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedType(null);
    }
  };

  const loadBackgroundImage = (url: string) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setBackgroundImage(img);
      setBackgroundImageUrl(url);
    };
    img.src = url;
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        loadBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveFormAsJSON = () => {
    const data: FormDesignerData = {
      version: '1.0',
      backgroundImage: backgroundImageUrl,
      textFields,
      checkboxes,
      stageWidth,
      stageHeight,
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (onSave) {
      onSave(data);
    }
  };

  const loadFormFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as FormDesignerData;
          setTextFields(data.textFields || []);
          setCheckboxes(data.checkboxes || []);
          if (data.backgroundImage) {
            loadBackgroundImage(data.backgroundImage);
          }
          setSelectedId(null);
          setSelectedType(null);
        } catch (error) {
          alert('Error loading form: Invalid JSON format');
          console.error(error);
        }
      };
      reader.readAsText(file);
    }
  };

  const exportAsPNG = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `form-${Date.now()}.png`;
      a.click();
    }
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current) {
      setSelectedId(null);
      setSelectedType(null);
    }
  };

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    let selectedNode: Konva.Node | null = null;
    if (selectedType === 'textfield') {
      selectedNode = stage.findOne(`#${selectedId}`);
    } else if (selectedType === 'checkbox') {
      selectedNode = stage.findOne(`#${selectedId}`);
    }
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, selectedType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        if (selectedType === 'textfield') {
          deleteTextField(selectedId);
        } else if (selectedType === 'checkbox') {
          deleteCheckbox(selectedId);
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedType(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedType]);

  return (
    <div className="form-designer">
      <div className="form-designer-header">
        <h1>Form Designer</h1>
        <div className="form-designer-toolbar">
          <button className={`toolbar-button ${mode === 'select' ? 'active' : ''}`} onClick={() => setMode('select')}>◇ Select</button>
          <button className="toolbar-button" onClick={addTextField}>T Text Field</button>
          <button className="toolbar-button" onClick={addCheckbox}>☑ Checkbox</button>
          <button className="toolbar-button" onClick={() => fileInputRef.current?.click()}>⬆ Background</button>
          {backgroundImageUrl && <button className="toolbar-button" onClick={() => { setBackgroundImage(null); setBackgroundImageUrl(''); }}>✕ Clear BG</button>}
          <button className="toolbar-button" onClick={saveFormAsJSON}>💾 Save JSON</button>
          <button className="toolbar-button" onClick={() => jsonInputRef.current?.click()}>📂 Load JSON</button>
          <button className="toolbar-button" onClick={exportAsPNG}>📷 PNG</button>
        </div>
        {selectedId && selectedType && <div className="selection-info"><span>{selectedType === 'textfield' ? '📝 Text Field' : '☑ Checkbox'}</span><button onClick={() => { if (selectedType === 'textfield') deleteTextField(selectedId); else deleteCheckbox(selectedId); }}>🗑 Delete</button></div>}
      </div>
      <div className="form-designer-canvas">
        <Stage ref={stageRef} width={stageWidth} height={stageHeight} onClick={handleStageClick} style={{ border: '2px solid #ccc', backgroundColor: '#fff' }}>
          <Layer ref={backgroundLayerRef} listening={false}><Rect width={stageWidth} height={stageHeight} fill="#ffffff" />{Array.from({ length: Math.ceil(stageHeight / 50) }).map((_, rowIdx) => Array.from({ length: Math.ceil(stageWidth / 50) }).map((_, colIdx) => <Rect key={`grid-${rowIdx}-${colIdx}`} x={colIdx * 50} y={rowIdx * 50} width={50} height={50} stroke="#e0e0e0" strokeWidth={0.5} />))}{backgroundImage && <KonvaImage ref={imageRef} image={backgroundImage} width={stageWidth} height={stageHeight} opacity={0.5} />}</Layer>
          <Layer ref={uiLayerRef}>{textFields.map(field => <Group key={field.id} id={field.id} x={field.x} y={field.y} draggable onClick={() => { setSelectedId(field.id); setSelectedType('textfield'); }} onDragEnd={e => { updateTextField(field.id, { x: Math.max(0, Math.min(e.target.x(), stageWidth - field.width)), y: Math.max(0, Math.min(e.target.y(), stageHeight - field.height)) }); }}><Rect width={field.width} height={field.height} fill="#f5f5f5" stroke={selectedId === field.id ? '#1976d2' : '#d0d0d0'} strokeWidth={selectedId === field.id ? 2 : 1} cornerRadius={4} /><Text text={field.text} width={field.width - 8} height={field.height} fontSize={field.fontSize} fontFamily={field.fontFamily} fill={field.fill} padding={4} verticalAlign="middle" /></Group>))}{checkboxes.map(checkbox => <Group key={checkbox.id} id={checkbox.id} x={checkbox.x} y={checkbox.y} draggable onClick={() => { setSelectedId(checkbox.id); setSelectedType('checkbox'); }} onDragEnd={e => { updateCheckbox(checkbox.id, { x: Math.max(0, Math.min(e.target.x(), stageWidth - checkbox.size)), y: Math.max(0, Math.min(e.target.y(), stageHeight - checkbox.size)) }); }}><Rect width={checkbox.size} height={checkbox.size} fill="#ffffff" stroke={selectedId === checkbox.id ? '#1976d2' : '#cccccc'} strokeWidth={selectedId === checkbox.id ? 2 : 1} />{checkbox.checked && <Text text="✓" width={checkbox.size} height={checkbox.size} fontSize={checkbox.size * 0.7} fill="#1976d2" align="center" verticalAlign="middle" />}<Text text={checkbox.label} x={checkbox.size + 8} y={checkbox.size / 2 - 8} fontSize={12} fontFamily="Arial" fill="#000000" /></Group>))}<Transformer ref={transformerRef} /></Layer>
        </Stage>
      </div>
           <div className="form-designer-properties">
        {selectedType === "textfield" && selectedId ? (
          (() => {
            const field = textFields.find((f) => f.id === selectedId);
            if (!field) {
              return (
                <div className="properties-panel">
                  <h3>Properties</h3>
                  <p>Select an element to edit</p>
                </div>
              );
            }

            return (
              <div className="properties-panel">
                <h3>Text Field Properties</h3>

                <div className="property-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={field.name || ""}
                    onChange={(e) =>
                      updateTextField(selectedId, { name: e.target.value })
                    }
                  />
                </div>

                <div className="property-group">
                  <label>Text:</label>
                  <input
                    type="text"
                    value={field.text}
                    onChange={(e) =>
                      updateTextField(selectedId, { text: e.target.value })
                    }
                  />
                </div>

                <div className="property-group">
                  <label>Font Size:</label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={field.fontSize}
                    onChange={(e) =>
                      updateTextField(selectedId, {
                        fontSize: Number(e.target.value),
                      })
                    }
                  />
                  <span>{field.fontSize}px</span>
                </div>

                <div className="property-group">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={field.fill}
                    onChange={(e) =>
                      updateTextField(selectedId, { fill: e.target.value })
                    }
                  />
                </div>
              </div>
            );
          })()
        ) : (
          <div className="properties-panel">
            <h3>Properties</h3>
            <p>Select an element to edit</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleBackgroundImageUpload}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={loadFormFromJSON}
      />
    </div>
  );
};

export default FormDesigner;
