"use client"

import React, { useState, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Upload, Download, Settings, Trash2, ArrowUp, ArrowDown, Plus, RotateCcw, ImageIcon, X, GripVertical } from 'lucide-react'
import html2canvas from 'html2canvas'

// --- TYPES ---
type Item = { id: string; content: string }
type Tier = { id: string; label: string; color: string; items: Item[] }

// --- INITIAL DATA ---
const initialTiers: Tier[] = [
  { id: 'tier-s', label: 'S', color: '#EF4444', items: [] }, 
  { id: 'tier-a', label: 'A', color: '#F97316', items: [] }, 
  { id: 'tier-b', label: 'B', color: '#EAB308', items: [] }, 
  { id: 'tier-c', label: 'C', color: '#22C55E', items: [] }, 
  { id: 'tier-d', label: 'D', color: '#3B82F6', items: [] }, 
  { id: 'tier-f', label: 'F', color: '#A855F7', items: [] }, 
]

export default function TierListPage() {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers)
  const [bank, setBank] = useState<Item[]>([]) 
  const [openTierId, setOpenTierId] = useState<string | null>(null) 
  const exportRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // --- ACTIONS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (event) => {
            if(event.target?.result) {
                setBank((prev) => [...prev, { id: `item-${Date.now()}-${Math.random()}`, content: event.target!.result as string }])
            }
        }
        reader.readAsDataURL(file)
    })
  }

  const addTier = () => {
    const newTier: Tier = { id: `tier-${Date.now()}`, label: 'NEW', color: '#52525B', items: [] }
    setTiers([...tiers, newTier])
  }

  const deleteTier = (id: string) => {
    setTiers(prev => prev.filter(t => t.id !== id))
    setOpenTierId(null)
  }

  const clearRow = (id: string) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, items: [] } : t))
    setOpenTierId(null)
  }

  const updateLabel = (id: string, newText: string) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, label: newText } : t))
  }

  const updateColor = (id: string, newColor: string) => {
    setTiers(tiers.map(t => t.id === id ? { ...t, color: newColor } : t))
  }

  const moveTier = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === tiers.length - 1) return
    const newTiers = [...tiers]
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newTiers[index], newTiers[targetIndex]] = [newTiers[targetIndex], newTiers[index]]
    setTiers(newTiers)
  }

  // --- DRAG LOGIC ---
  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result
    if (!destination) return

    if (type === 'TIER') {
        const newTiers = [...tiers]
        const [movedTier] = newTiers.splice(source.index, 1)
        newTiers.splice(destination.index, 0, movedTier)
        setTiers(newTiers)
        return
    }

    const getList = (id: string) => (id === 'bank' ? bank : tiers.find(t => t.id === id)?.items || [])
    const sourceList = [...getList(source.droppableId)]
    const destList = source.droppableId === destination.droppableId ? sourceList : [...getList(destination.droppableId)]
    const [movedItem] = sourceList.splice(source.index, 1)
    destList.splice(destination.index, 0, movedItem)

    if (source.droppableId === 'bank') setBank(sourceList)
    else setTiers(prev => prev.map(t => t.id === source.droppableId ? { ...t, items: sourceList } : t))

    if (destination.droppableId === 'bank') setBank(destList)
    else if (source.droppableId !== destination.droppableId) {
        setTiers(prev => prev.map(t => t.id === destination.droppableId ? { ...t, items: destList } : t))
    }
  }

  const handleDownload = async () => {
    if (!exportRef.current) return
    const canvas = await html2canvas(exportRef.current, { useCORS: true, backgroundColor: '#000', scale: 2 })
    const link = document.createElement('a')
    link.download = 'tier-list.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500 selection:text-white pb-32">
      
      {/* NAVBAR */}
      <nav className="border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 select-none">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">T</div>
                <h1 className="text-2xl font-black tracking-tighter text-white">TIER<span className="text-indigo-500">MAKER</span></h1>
            </div>
            <div className="flex gap-3">
                <label className="cursor-pointer group flex items-center gap-2 bg-[#27272a] hover:bg-[#3f3f46] border border-white/10 px-4 py-2 rounded-lg font-bold text-sm transition-all text-gray-200">
                    <Upload size={16} className="text-gray-400 group-hover:text-white"/> 
                    <span>UPLOAD</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <button onClick={handleDownload} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">
                    <Download size={16} /> <span>SAVE</span>
                </button>
            </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* HEADER CONTROLS */}
        <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-3xl font-black text-white">Create Your List</h2>
                <p className="text-zinc-500 text-sm mt-1">Drag and drop to rank your items.</p>
            </div>
            <button onClick={addTier} className="flex items-center gap-2 px-4 py-2 rounded bg-[#1a1a1a] text-white border border-zinc-700 hover:bg-zinc-800 transition-all font-bold text-sm uppercase">
                <Plus size={16} /> Add Row
            </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
            
            {/* --- MAIN TABLE --- */}
            <div ref={exportRef} className="bg-black border-[3px] border-black rounded-lg overflow-visible mb-12 shadow-2xl shadow-black/50">
                <Droppable droppableId="all-tiers" type="TIER">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-[2px] bg-black">
                            {tiers.map((tier, index) => (
                                <Draggable key={tier.id} draggableId={tier.id} index={index}>
                                    {(provided) => (
                                        <div 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`flex min-h-[85px] bg-[#121212] group relative ${openTierId === tier.id ? 'z-50' : 'z-0'}`}
                                        >
                                            
                                            {/* 1. LABEL (DRAG HANDLE) */}
                                            <div 
                                                {...provided.dragHandleProps} 
                                                className="w-24 sm:w-28 flex-shrink-0 flex flex-col items-center justify-center relative border-r-2 border-black cursor-grab active:cursor-grabbing group/label"
                                                style={{ backgroundColor: tier.color }}
                                            >
                                                <GripVertical className="absolute left-1 text-black/20 group-hover/label:text-black/50" size={16} />
                                                <textarea 
                                                    value={tier.label}
                                                    onChange={(e) => updateLabel(tier.id, e.target.value)}
                                                    onPointerDown={(e) => e.stopPropagation()} 
                                                    className="relative z-10 bg-transparent text-center text-black font-black text-2xl w-full h-full resize-none outline-none flex flex-col justify-center items-center pt-6 overflow-hidden leading-none uppercase tracking-tighter placeholder-black/30"
                                                    spellCheck={false}
                                                />
                                            </div>

                                            {/* 2. ITEMS AREA */}
                                            <Droppable droppableId={tier.id} direction="horizontal" type="ITEM">
                                                {(provided, snapshot) => (
                                                    <div 
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className={`flex-1 flex flex-wrap content-start p-1 transition-colors min-h-[85px] ${snapshot.isDraggingOver ? 'bg-[#1a1a1e]' : 'bg-[#121212]'}`}
                                                    >
                                                        {tier.items.map((item, index) => (
                                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                                {(provided) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className="relative m-[1px]"
                                                                    >
                                                                        <img 
                                                                            src={item.content} 
                                                                            alt="item"
                                                                            className="w-[85px] h-[85px] object-cover select-none pointer-events-none"
                                                                            style={{display: 'block'}} 
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>

                                            {/* 3. RIGHT CONTROLS */}
                                            <div className="w-12 bg-[#09090b] border-l-2 border-black flex flex-col items-center justify-between py-1 relative">
                                                
                                                <button 
                                                    type="button"
                                                    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                                    onClick={() => setOpenTierId(openTierId === tier.id ? null : tier.id)}
                                                    className={`p-2 rounded transition-all ${openTierId === tier.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                                >
                                                    <Settings size={18} />
                                                </button>

                                                {/* --- SETTINGS POPUP --- */}
                                                {openTierId === tier.id && (
                                                    <div 
                                                        className="absolute right-full top-0 mr-2 z-[100] w-64 bg-[#18181b] border border-zinc-700 rounded-xl shadow-2xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-100 origin-top-right cursor-default"
                                                        onPointerDown={(e) => e.stopPropagation()} 
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Row Settings</span>
                                                            <button onClick={() => setOpenTierId(null)} className="text-zinc-500 hover:text-white"><X size={14}/></button>
                                                        </div>

                                                        {/* COLOR INPUT - SIMPLE & ROBUST */}
                                                        <div>
                                                            <label className="text-xs text-zinc-500 mb-2 block font-medium">Row Color</label>
                                                            <div className="flex gap-2 h-10">
                                                                {/* Visual Preview */}
                                                                <div 
                                                                    className="w-10 h-10 rounded border border-white/20 shadow-inner" 
                                                                    style={{backgroundColor: tier.color}}
                                                                />
                                                                {/* NATIVE INPUT (Visible and working) */}
                                                                <input 
                                                                    type="color"
                                                                    value={tier.color}
                                                                    onChange={(e) => updateColor(tier.id, e.target.value)}
                                                                    className="flex-1 h-full cursor-pointer bg-transparent border border-zinc-700 rounded p-0"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <button onClick={() => clearRow(tier.id)} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded flex items-center justify-center gap-2 transition-colors">
                                                                <RotateCcw size={14} /> Clear Images
                                                            </button>
                                                            <button onClick={() => deleteTier(tier.id)} className="w-full py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold text-xs rounded flex items-center justify-center gap-2 transition-colors border border-red-900/30">
                                                                <Trash2 size={14} /> Delete Row
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-col gap-1 mt-auto w-full px-1">
                                                    <button 
                                                        onClick={() => moveTier(index, 'up')} 
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        disabled={index === 0}
                                                        className={`p-1 w-full flex justify-center rounded hover:bg-zinc-800 transition-colors ${index === 0 ? 'opacity-20 cursor-default' : 'text-zinc-500 hover:text-white'}`}
                                                    >
                                                        <ArrowUp size={16} strokeWidth={3} />
                                                    </button>
                                                    <button 
                                                        onClick={() => moveTier(index, 'down')} 
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        disabled={index === tiers.length - 1}
                                                        className={`p-1 w-full flex justify-center rounded hover:bg-zinc-800 transition-colors ${index === tiers.length - 1 ? 'opacity-20 cursor-default' : 'text-zinc-500 hover:text-white'}`}
                                                    >
                                                        <ArrowDown size={16} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>

            {/* --- IMAGE BANK --- */}
            <div className="bg-[#18181b] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-[#202024] px-6 py-4 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={18} className="text-indigo-500"/>
                        <span className="font-bold text-gray-200 tracking-wide text-sm uppercase">Image Bank</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-500 bg-black/30 px-2 py-1 rounded">{bank.length} IMAGES</span>
                </div>
                <Droppable droppableId="bank" direction="horizontal" type="ITEM">
                    {(provided, snapshot) => (
                        <div 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`flex flex-wrap gap-2 p-6 min-h-[180px] ${snapshot.isDraggingOver ? 'bg-[#1f1f22]' : ''}`}
                        >
                            {bank.length === 0 && (
                                <div className="w-full flex flex-col items-center justify-center text-zinc-600 py-10 border-2 border-dashed border-zinc-800 rounded-xl">
                                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                        <Upload size={24} className="opacity-40" />
                                    </div>
                                    <p className="font-medium text-gray-500">No images yet</p>
                                    <p className="text-sm opacity-30 mt-1">Upload to start ranking</p>
                                </div>
                            )}
                            {bank.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="hover:scale-105 transition-transform cursor-grab active:cursor-grabbing"
                                        >
                                            <img 
                                                src={item.content} 
                                                alt="bank-item"
                                                className="w-[85px] h-[85px] object-cover rounded-md shadow-lg border border-white/5 bg-zinc-800"
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>

        </DragDropContext>
      </div>
    </div>
  )
}