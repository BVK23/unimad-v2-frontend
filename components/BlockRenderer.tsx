import React, { useEffect, useRef, useState } from 'react';
import {
    ExternalLink, Link as LinkIcon, ChevronDown, ChevronRight, Copy, UploadCloud, Trash2, X, Plus, Minus
} from 'lucide-react';
import { PortfolioItem } from '../types';
import RichTextEditor from './RichTextEditor';

interface BlockRendererProps {
    item: PortfolioItem;
    isEditMode: boolean;
    onUpdate: (id: string, updates: Partial<PortfolioItem>) => void;
    onSelectProject?: (item: PortfolioItem) => void;
    onMeasureCollapsedHeight?: (id: string, height: number) => void;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ item, isEditMode, onUpdate, onSelectProject, onMeasureCollapsedHeight }) => {
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const cropPreviewRef = useRef<HTMLDivElement>(null);
    const collapsedTextRef = useRef<HTMLDivElement>(null);
    const cropDragStateRef = useRef<{ x: number; y: number } | null>(null);
    const [isMediaDragOver, setIsMediaDragOver] = useState(false);
    const [cropModal, setCropModal] = useState<{
        source: string;
        fileName?: string;
        mimeType?: string;
    } | null>(null);
    const [selectedCropRatio, setSelectedCropRatio] = useState<NonNullable<PortfolioItem['cropRatio']>>(item.cropRatio || '4:5');
    const [cropZoom, setCropZoom] = useState(1);
    const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
    const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        if (!onMeasureCollapsedHeight || item.type !== 'text' || !item.isCollapsible || !item.isCollapsed || !collapsedTextRef.current) {
            return;
        }

        const node = collapsedTextRef.current;
        const report = () => onMeasureCollapsedHeight(item.id, Math.ceil(node.getBoundingClientRect().height));
        report();

        const observer = new ResizeObserver(() => report());
        observer.observe(node);
        return () => observer.disconnect();
    }, [item.id, item.type, item.isCollapsible, item.isCollapsed, item.title, isEditMode, onMeasureCollapsedHeight]);

    const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    const CROP_RATIOS: Record<NonNullable<PortfolioItem['cropRatio']>, number> = {
        '1:1': 1,
        '3:4': 3 / 4,
        '4:5': 4 / 5,
        '16:9': 16 / 9,
    };

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const getCropGeometry = (
        imageWidth: number,
        imageHeight: number,
        ratioLabel: NonNullable<PortfolioItem['cropRatio']>,
        zoom: number,
        pan: { x: number; y: number },
    ) => {
        const ratio = CROP_RATIOS[ratioLabel];
        let baseCropWidth = imageWidth;
        let baseCropHeight = baseCropWidth / ratio;

        if (baseCropHeight > imageHeight) {
            baseCropHeight = imageHeight;
            baseCropWidth = baseCropHeight * ratio;
        }

        const cropWidth = baseCropWidth / zoom;
        const cropHeight = baseCropHeight / zoom;
        const maxPanX = Math.max(0, (imageWidth - cropWidth) / 2);
        const maxPanY = Math.max(0, (imageHeight - cropHeight) / 2);
        const offsetX = clamp((imageWidth - cropWidth) / 2 + pan.x * maxPanX, 0, imageWidth - cropWidth);
        const offsetY = clamp((imageHeight - cropHeight) / 2 + pan.y * maxPanY, 0, imageHeight - cropHeight);

        return { cropWidth, cropHeight, offsetX, offsetY };
    };

    const applyImageCrop = (
        source: string,
        ratioLabel: NonNullable<PortfolioItem['cropRatio']>,
        zoom: number,
        pan: { x: number; y: number },
        callback: (croppedDataUrl: string) => void
    ) => {
        const img = new Image();
        img.onload = () => {
            const { cropWidth, cropHeight, offsetX, offsetY } = getCropGeometry(
                img.naturalWidth,
                img.naturalHeight,
                ratioLabel,
                zoom,
                pan
            );

            const canvas = document.createElement('canvas');
            canvas.width = Math.round(cropWidth);
            canvas.height = Math.round(cropHeight);
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(
                img,
                offsetX,
                offsetY,
                cropWidth,
                cropHeight,
                0,
                0,
                canvas.width,
                canvas.height
            );

            callback(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.src = source;
    };

    const openCropModal = (source: string, fileName?: string, mimeType?: string) => {
        setSelectedCropRatio(item.cropRatio || '4:5');
        setCropZoom(1);
        setCropPan({ x: 0, y: 0 });
        setCropModal({ source, fileName, mimeType });
    };

    const commitImageUpdate = (dataUrl: string, fileName?: string, mimeType = 'image/jpeg') => {
        onUpdate(item.id, {
            content: dataUrl,
            mediaType: 'image',
            mediaName: fileName || item.mediaName,
            mediaMimeType: mimeType,
            cropRatio: selectedCropRatio,
        });
    };

    const handleMediaFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const mimeType = file.type || '';
            const inferredType: PortfolioItem['mediaType'] = mimeType.startsWith('video/')
                ? 'video'
                : mimeType === 'application/pdf'
                    ? 'pdf'
                    : 'image';

            const result = String(reader.result || '');
            if (inferredType === 'image') {
                openCropModal(result, file.name, mimeType);
                return;
            }

            onUpdate(item.id, {
                content: result,
                mediaType: inferredType,
                mediaName: file.name,
                mediaMimeType: mimeType
            });
        };
        reader.readAsDataURL(file);
    };

    const openMediaPicker = (e: React.MouseEvent) => {
        e.stopPropagation();
        mediaInputRef.current?.click();
    };

    const onMediaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const file = e.target.files?.[0];
        if (!file) return;
        handleMediaFileUpload(file);
        e.target.value = '';
    };

    useEffect(() => {
        if (!cropModal) return;
        const img = new Image();
        img.onload = () => {
            setCropImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = cropModal.source;
    }, [cropModal]);

    const cropGeometry = cropModal && cropImageSize.width && cropImageSize.height
        ? getCropGeometry(cropImageSize.width, cropImageSize.height, selectedCropRatio, cropZoom, cropPan)
        : null;

    const cropPreviewStyle = cropGeometry && cropImageSize.width && cropImageSize.height ? {
        backgroundImage: `url(${cropModal?.source})`,
        backgroundSize: `${(cropImageSize.width / cropGeometry.cropWidth) * 100}% ${(cropImageSize.height / cropGeometry.cropHeight) * 100}%`,
        backgroundPosition: `${(cropGeometry.offsetX / Math.max(1, cropImageSize.width - cropGeometry.cropWidth)) * 100}% ${(cropGeometry.offsetY / Math.max(1, cropImageSize.height - cropGeometry.cropHeight)) * 100}%`,
    } : undefined;

    const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!cropPreviewRef.current) return;
        cropDragStateRef.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!cropDragStateRef.current || !cropPreviewRef.current) return;
        const rect = cropPreviewRef.current.getBoundingClientRect();
        const dx = e.clientX - cropDragStateRef.current.x;
        const dy = e.clientY - cropDragStateRef.current.y;
        cropDragStateRef.current = { x: e.clientX, y: e.clientY };
        setCropPan((prev) => ({
            x: clamp(prev.x - dx / Math.max(1, rect.width), -1, 1),
            y: clamp(prev.y - dy / Math.max(1, rect.height), -1, 1),
        }));
    };

    const handleCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        cropDragStateRef.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const parseTableContent = (value?: string): string[][] => {
        if (!value) return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ''));
        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) throw new Error('Invalid table');
            const rows = parsed.filter(Array.isArray).map((row: unknown[]) => row.map((cell) => String(cell ?? '')));
            if (!rows.length) throw new Error('Empty table');
            return rows;
        } catch {
            return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ''));
        }
    };

    const serializeTableContent = (rows: string[][]) => JSON.stringify(rows);

    const cropModalNode = cropModal ? (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCropModal(null)}>
            <div className="w-full max-w-3xl bg-white dark:bg-[#0c0c0c] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Crop Image</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose a crop ratio before saving the image.</p>
                    </div>
                    <button onClick={() => setCropModal(null)} className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(CROP_RATIOS) as Array<NonNullable<PortfolioItem['cropRatio']>>).map((ratio) => (
                            <button
                                key={ratio}
                                type="button"
                                onClick={() => setSelectedCropRatio(ratio)}
                                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                                    selectedCropRatio === ratio
                                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                                        : 'border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>

                    <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-4 flex items-center justify-center min-h-[360px]">
                        <div
                            ref={cropPreviewRef}
                            className="w-full max-w-xl overflow-hidden rounded-2xl bg-black/5 dark:bg-black/30 shadow-inner"
                            style={{ aspectRatio: String(CROP_RATIOS[selectedCropRatio]) }}
                            onPointerDown={handleCropPointerDown}
                            onPointerMove={handleCropPointerMove}
                            onPointerUp={handleCropPointerUp}
                            onPointerCancel={handleCropPointerUp}
                        >
                            <div
                                className="w-full h-full bg-center bg-no-repeat bg-cover cursor-grab active:cursor-grabbing"
                                style={cropPreviewStyle}
                            >
                                <div
                                    className="w-full h-full pointer-events-none"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(to right, rgba(255,255,255,0.28) 1px, transparent 1px),
                                            linear-gradient(to bottom, rgba(255,255,255,0.28) 1px, transparent 1px)
                                        `,
                                        backgroundSize: '33.333% 100%, 100% 33.333%',
                                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                            <span>Zoom</span>
                            <span>{cropZoom.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={cropZoom}
                            onChange={(e) => setCropZoom(Number(e.target.value))}
                            className="w-full accent-brand-600"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setCropModal(null)}
                            className="px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                applyImageCrop(cropModal.source, selectedCropRatio, cropZoom, cropPan, (croppedDataUrl) => {
                                    commitImageUpdate(croppedDataUrl, cropModal.fileName, cropModal.mimeType || 'image/jpeg');
                                    setCropModal(null);
                                });
                            }}
                            className="px-5 py-2 rounded-full text-xs font-semibold bg-brand-600 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/25"
                        >
                            Save Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    // -- Text Block --
    if (item.type === 'text') {
        const heightPx = item.height ?? 160;
        const compact = heightPx <= 96;
        const toggleCollapsed = () => onUpdate(item.id, { isCollapsed: !item.isCollapsed });

        return (
            <div
                ref={item.isCollapsible && item.isCollapsed ? collapsedTextRef : null}
                className={`relative flex flex-col group/text bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 transition-all ${isEditMode ? 'hover:border-brand-500/30' : ''} p-6 ${item.isCollapsed ? '' : 'h-full'}`}
            >
                {(item.title || isEditMode || item.isCollapsible) && (
                    <div className={`flex items-center gap-2 ${item.isCollapsed ? '' : 'mb-3'}`}>
                        {item.isCollapsible && (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleCollapsed(); }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-brand-600 z-10"
                            >
                                {item.isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                            </button>
                        )}
                        {isEditMode ? (
                            <RichTextEditor
                                value={item.title || ''}
                                onChange={(value) => onUpdate(item.id, { title: value })}
                                onToggleCollapsible={() => onUpdate(item.id, { isCollapsible: !item.isCollapsible })}
                                isCollapsible={Boolean(item.isCollapsible)}
                                className="w-full bg-transparent text-slate-900 dark:text-white font-semibold text-lg min-h-0"
                                placeholder="Section Title"
                            />
                        ) : (
                            item.title && (
                                <h3
                                    className="font-semibold text-lg text-slate-900 dark:text-white"
                                    dangerouslySetInnerHTML={{ __html: item.title }}
                                />
                            )
                        )}
                    </div>
                )}

                {!item.isCollapsed && (
                    <div className={`flex-1 ${item.isCollapsible ? 'pl-8' : ''}`}>
                        {isEditMode ? (
                            <RichTextEditor
                                value={item.content || ''}
                                onChange={(value) => onUpdate(item.id, { content: value })}
                                className={`w-full outline-none bg-transparent h-full min-h-0 text-slate-600 dark:text-slate-300
                                    ${item.fontSize === '2xl' ? 'text-2xl font-semibold' : item.fontSize === 'xl' ? 'text-xl font-semibold' : 'text-base'}
                                    ${item.fontWeight === 'bold' ? 'font-semibold' : item.fontWeight === 'medium' ? 'font-medium' : 'font-normal'}
                                `}
                                placeholder={compact ? '' : 'Type your content here... select text for formatting options.'}
                            />
                        ) : (
                            <div
                                className={`
                                    prose prose-slate max-w-none dark:prose-invert text-slate-600 dark:text-slate-300
                                    ${item.fontSize === '2xl' ? 'prose-2xl font-semibold' : item.fontSize === 'xl' ? 'prose-xl font-semibold' : 'text-base'}
                                `}
                                dangerouslySetInnerHTML={{ __html: item.content || '' }}
                            />
                        )}
                    </div>
                )}

            </div>
        );
    }

    // -- Media Block (Image, Video, PDF) --
    if (item.type === 'media') {
        const isVideo = item.mediaType === 'video';
        const isPDF = item.mediaType === 'pdf';

        const onDropMedia = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMediaDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file && isEditMode) handleMediaFileUpload(file);
        };

        return (
            <>
            <div
                className={`h-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group/media relative shadow-sm transition-all ${isEditMode ? 'hover:border-brand-500/30' : ''} ${isMediaDragOver ? 'border-brand-500 ring-2 ring-brand-200' : ''}`}
                onDragOver={(e) => {
                    if (!isEditMode) return;
                    e.preventDefault();
                    setIsMediaDragOver(true);
                }}
                onDragLeave={(e) => {
                    if (!isEditMode) return;
                    e.preventDefault();
                    setIsMediaDragOver(false);
                }}
                onDrop={onDropMedia}
            >
                <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    className="hidden"
                    onChange={onMediaInputChange}
                />

                {item.content ? (
                    <>
                        {isVideo ? (
                            <video src={item.content} controls className="w-full h-full min-h-0 object-cover bg-black" />
                        ) : isPDF ? (
                            <div className="h-full min-h-0 p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900">
                                <Copy size={42} className="text-slate-300 mb-4" />
                                <p className="font-semibold text-slate-700 dark:text-slate-100">{item.mediaName || item.title || 'Uploaded document'}</p>
                                <a
                                    href={item.content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs uppercase tracking-widest text-brand-600 mt-2 font-medium"
                                >
                                    Open PDF
                                </a>
                            </div>
                        ) : (
                            <img src={item.content} alt={item.mediaName || 'Media content'} className="w-full h-full min-h-0 object-cover group-hover/media:scale-105 transition-transform duration-700" />
                        )}

                        {isEditMode && (
                            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/media:opacity-100 transition-opacity flex flex-col items-end gap-2">
                                {!isVideo && !isPDF && item.content && (
                                    <button
                                        onClick={() => openCropModal(item.content, item.mediaName, item.mediaMimeType)}
                                        className="text-[10px] font-medium bg-white/95 dark:bg-slate-900 text-slate-700 dark:text-white rounded-full px-3 py-1.5 shadow-xl border border-slate-200 dark:border-white/10"
                                    >
                                        Crop Image
                                    </button>
                                )}
                                <button
                                    onClick={openMediaPicker}
                                    className="text-[10px] font-medium bg-white/95 dark:bg-slate-900 text-slate-700 dark:text-white rounded-full px-3 py-1.5 shadow-xl border border-slate-200 dark:border-white/10"
                                >
                                    Replace Media
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={openMediaPicker}
                        className="w-full min-h-0 h-full p-8 border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand-500 hover:text-brand-600 transition-colors flex flex-col items-center justify-center gap-3 text-slate-400"
                    >
                        <UploadCloud size={30} />
                        <span className="text-sm font-semibold">Upload Media</span>
                        <span className="text-[11px] uppercase tracking-wider font-medium">Drag & drop or click to browse</span>
                    </button>
                )}
            </div>
            {cropModalNode}
            </>
        );
    }

    // -- Link Box Block --
    if (item.type === 'link-box') {
        const hasPreviewImage = Boolean(item.content);
        const heightPx = item.height ?? 96;
        const compact = heightPx <= 110;
        const onDropLinkPreview = (e: React.DragEvent<HTMLAnchorElement>) => {
            if (!isEditMode) return;
            e.preventDefault();
            e.stopPropagation();
            setIsMediaDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleMediaFileUpload(file);
        };

        return (
            <>
            <a
                href={(!isEditMode && item.linkUrl) ? item.linkUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`h-full min-h-0 w-full flex items-center p-4 border rounded-2xl bg-white dark:bg-white/5 transition-all group/link ${isEditMode ? 'border-slate-100 dark:border-white/10 hover:border-brand-500/30' : 'border-slate-100 dark:border-white/10 hover:shadow-lg hover:-translate-y-1'} ${isMediaDragOver && isEditMode ? 'border-brand-500 ring-2 ring-brand-200' : ''}`}
                onDragOver={(e) => {
                    if (!isEditMode) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMediaDragOver(true);
                }}
                onDragLeave={(e) => {
                    if (!isEditMode) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMediaDragOver(false);
                }}
                onDrop={onDropLinkPreview}
            >
                <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onMediaInputChange}
                />

                <div className="w-14 h-14 flex-shrink-0 bg-slate-50 dark:bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden text-slate-400 group-hover/link:text-brand-500 group-hover/link:bg-brand-50 transition-colors">
                    {hasPreviewImage ? (
                        <img src={item.content} className="w-full h-full object-cover" alt="Page box preview" />
                    ) : item.linkIcon ? (
                        <img src={item.linkIcon} className="w-7 h-7 grayscale group-hover/link:grayscale-0 transition-all" />
                    ) : (
                        <LinkIcon size={24} />
                    )}
                </div>
                <div className="ml-5 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                        {isEditMode ? (
                            <input
                                value={item.title || ''}
                                onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="font-semibold text-slate-900 dark:text-white bg-transparent outline-none w-full placeholder:text-slate-300 text-lg"
                                placeholder="Link Box Title"
                            />
                        ) : (
                            <span className="font-semibold text-lg text-slate-900 dark:text-white truncate">{item.title || 'External Link'}</span>
                        )}
                        {!isEditMode && <ExternalLink size={14} className="text-slate-300 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />}
                    </div>
                    {isEditMode ? (
                        !compact && (
                            <div className="mt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={openMediaPicker}
                                    className="text-xs font-medium text-slate-500 hover:text-brand-600 transition-colors"
                                >
                                    Upload image or GIF
                                </button>
                                {hasPreviewImage && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openCropModal(item.content, item.mediaName, item.mediaMimeType);
                                        }}
                                        className="text-xs font-medium text-slate-500 hover:text-brand-600 transition-colors"
                                    >
                                        Crop image
                                    </button>
                                )}
                            </div>
                        )
                    ) : (
                        <p className="text-sm font-medium text-slate-400 mt-1 truncate">{item.linkUrl || 'Open page'}</p>
                    )}
                </div>
            </a>
            {cropModalNode}
            </>
        );
    }

    // -- Page Card (Project) --
    if (item.type === 'page-card' || item.type === 'project') {
        const normalizedTitle = (item.title || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        const normalizedDescription = (item.description || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        const hasTitle = Boolean(stripHtml(normalizedTitle));
        const hasDescription = Boolean(normalizedDescription);
        const hasAnyText = hasTitle || hasDescription;
        const coverEnabled = item.showCoverImage !== false;
        const heightPx = item.height ?? 160;
        // Height-based text visibility (3-step collapse):
        // - >= 144px: image + title + subtitle
        // - >= 108px: image + title
        // - < 108px:  image only
        // The grid uses 12px rows, so these thresholds align to row boundaries (12=144, 9=108).
        const TITLE_ONLY_MIN_PX = 108;
        const TITLE_AND_SUBTITLE_MIN_PX = 144;

        const showTextArea = coverEnabled ? heightPx >= TITLE_ONLY_MIN_PX : true;
        const showSubtitle = coverEnabled ? heightPx >= TITLE_AND_SUBTITLE_MIN_PX : true;

        const onDropCover = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.dataTransfer.files?.[0];
            if (file && isEditMode) handleMediaFileUpload(file);
        };

        return (
            <>
            <div
                onClick={() => (!isEditMode && onSelectProject) ? onSelectProject(item) : undefined}
                className={`h-full rounded-2xl bg-white dark:bg-[#111] overflow-hidden group/card transition-all duration-500 flex flex-col border border-slate-100 dark:border-white/5 shadow-sm relative
                    ${isEditMode ? 'hover:border-brand-500/30' : 'cursor-pointer hover:shadow-2xl hover:-translate-y-1 hover:border-slate-200'}
                `}
            >
                {coverEnabled ? (
                    <div
                        className="relative overflow-hidden w-full bg-slate-100 dark:bg-slate-800 transition-all duration-500 flex-1 min-h-0"
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={onDropCover}
                    >
                        {isEditMode && (
                            <div className="absolute inset-0 z-10 opacity-0 group-hover/card:opacity-100 bg-black/40 flex flex-col items-center justify-center p-4 transition-opacity gap-2">
                                <button
                                    onClick={openMediaPicker}
                                    className="text-[10px] font-medium bg-white/95 text-slate-700 rounded-full px-4 py-2 shadow-xl border border-slate-200 hover:bg-white transition-colors"
                                >
                                    Replace Image
                                </button>
                                {item.content && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openCropModal(item.content, item.mediaName, item.mediaMimeType);
                                        }}
                                        className="text-[10px] font-medium bg-white/95 text-slate-700 rounded-full px-4 py-2 shadow-xl border border-slate-200 hover:bg-white transition-colors"
                                    >
                                        Crop Image
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdate(item.id, { showCoverImage: false });
                                    }}
                                    className="text-[10px] font-medium bg-white/95 text-slate-700 rounded-full px-4 py-2 shadow-xl border border-slate-200 hover:bg-white transition-colors"
                                >
                                    Hide Cover
                                </button>
                                <span className="text-[9px] text-white/60 mt-1 font-bold uppercase tracking-tighter">or drag & drop</span>
                            </div>
                        )}
                        {item.content ? (
                            <img src={item.content} alt={item.title || 'Project cover'} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-slate-300 font-medium uppercase tracking-widest text-xs">No Cover Image</span>
                            </div>
                        )}
                    </div>
                ) : (
                    isEditMode && (
                        <div className="p-4">
                            <button
                                type="button"
                                onClick={openMediaPicker}
                                className="w-full px-4 py-2 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-brand-500/40 transition-all"
                            >
                                Add Cover Image
                            </button>
                        </div>
                    )
                )}

                {(isEditMode || hasAnyText) && showTextArea && (
                    <div
                        className={`px-4 md:px-4 flex flex-col flex-shrink-0 w-full overflow-hidden ${
                            showSubtitle ? 'py-6 md:py-8' : 'py-4 md:py-6'
                        }`}
                    >
                        {isEditMode ? (
                            <div className={`space-y-3 ${showSubtitle ? '' : 'space-y-2'}`}>
                                <RichTextEditor
                                    value={item.title || ''}
                                    onChange={(value) => onUpdate(item.id, { title: value })}
                                    className="w-full bg-transparent text-2xl font-semibold text-slate-900 dark:text-white min-h-[2rem]"
                                    placeholder="Page Title"
                                />
                                {showSubtitle && (
                                    <textarea
                                        value={item.description || ''}
                                        onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-base text-slate-500 dark:text-slate-400 bg-transparent outline-none w-full mt-0 resize-none min-h-[3rem]"
                                        placeholder="Subtitle"
                                        rows={2}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className={`space-y-3 ${showSubtitle ? '' : 'space-y-2'}`}>
                                {hasTitle ? (
                                    <h3
                                        className="font-semibold text-2xl text-slate-900 dark:text-white leading-tight min-h-[2rem]"
                                        dangerouslySetInnerHTML={{ __html: normalizedTitle }}
                                    />
                                ) : (
                                    <div className="min-h-[2rem]" />
                                )}
                                {showSubtitle && hasDescription ? (
                                    <p className="text-base text-slate-500 dark:text-slate-400 line-clamp-3 text-pretty min-h-[3rem]">
                                        {normalizedDescription}
                                    </p>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {cropModalNode}
            </>
        );
    }

    if (item.type === 'table') {
        const rows = parseTableContent(item.content);
        const columnCount = Math.max(1, ...rows.map((row) => row.length));
        const normalizedRows = rows.map((row) =>
            row.length < columnCount ? [...row, ...Array.from({ length: columnCount - row.length }, () => '')] : row
        );

        const updateCell = (rowIndex: number, colIndex: number, nextValue: string) => {
            const nextRows = normalizedRows.map((row, rIdx) =>
                rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? nextValue : cell)) : row
            );
            onUpdate(item.id, { content: serializeTableContent(nextRows) });
        };

        const addRow = () => {
            const nextRows = [...normalizedRows, Array.from({ length: columnCount }, () => '')];
            onUpdate(item.id, { content: serializeTableContent(nextRows) });
        };

        const removeRow = () => {
            if (normalizedRows.length <= 1) return;
            onUpdate(item.id, { content: serializeTableContent(normalizedRows.slice(0, -1)) });
        };

        const addColumn = () => {
            const nextRows = normalizedRows.map((row) => [...row, '']);
            onUpdate(item.id, { content: serializeTableContent(nextRows) });
        };

        const removeColumn = () => {
            if (columnCount <= 1) return;
            const nextRows = normalizedRows.map((row) => row.slice(0, -1));
            onUpdate(item.id, { content: serializeTableContent(nextRows) });
        };

        return (
            <div className={`h-full rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 p-4 flex flex-col gap-3 ${isEditMode ? 'hover:border-brand-500/30' : ''}`}>
                {isEditMode && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button type="button" onClick={addRow} className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1">
                            <Plus size={12} /> Row
                        </button>
                        <button type="button" onClick={removeRow} className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1">
                            <Minus size={12} /> Row
                        </button>
                        <button type="button" onClick={addColumn} className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1">
                            <Plus size={12} /> Column
                        </button>
                        <button type="button" onClick={removeColumn} className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:border-brand-500/40 inline-flex items-center gap-1">
                            <Minus size={12} /> Column
                        </button>
                    </div>
                )}
                <div className="overflow-auto rounded-xl border border-slate-200 dark:border-white/10">
                    <table className="w-full border-collapse text-sm">
                        <tbody>
                            {normalizedRows.map((row, rowIndex) => (
                                <tr key={`row-${rowIndex}`}>
                                    {row.map((cell, colIndex) => (
                                        <td key={`cell-${rowIndex}-${colIndex}`} className="border border-slate-200 dark:border-white/10 p-0 align-top">
                                            {isEditMode ? (
                                                <RichTextEditor
                                                    value={cell}
                                                    onChange={(value) => updateCell(rowIndex, colIndex, value)}
                                                    className="w-full min-w-[120px] bg-transparent px-3 py-2 outline-none text-slate-700 dark:text-slate-200 min-h-[38px]"
                                                    placeholder={rowIndex === 0 ? `Header ${colIndex + 1}` : 'Cell'}
                                                />
                                            ) : (
                                                <div
                                                    className="px-3 py-2 text-slate-700 dark:text-slate-200 min-h-[38px] prose prose-sm max-w-none dark:prose-invert"
                                                    dangerouslySetInnerHTML={{ __html: cell }}
                                                />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (item.type === 'embed') {
        const embedVariant = item.variant === 'figma' ? 'figma' : 'code';
        const embedValue = item.content || '';
        const normalizedEmbedValue = embedValue.trim();
        const hasEmbedValue = normalizedEmbedValue.length > 0;
        const looksLikeUrl = /^https?:\/\//i.test(normalizedEmbedValue);
        const figmaUrl = embedVariant === 'figma'
            ? (normalizedEmbedValue.includes('figma.com') ? `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(normalizedEmbedValue)}` : '')
            : '';

        return (
            <div className={`h-full rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 p-4 flex flex-col gap-3 ${isEditMode ? 'hover:border-brand-500/30' : ''}`}>
                {isEditMode ? (
                    <input
                        type="text"
                        value={embedValue}
                        onChange={(e) => onUpdate(item.id, { content: e.target.value })}
                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 outline-none text-sm text-slate-700 dark:text-slate-200"
                        placeholder={embedVariant === 'figma'
                            ? 'Paste Figma file/share URL'
                            : 'Paste embed HTML or URL'}
                    />
                ) : null}

                <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
                    {hasEmbedValue ? (
                        embedVariant === 'figma' ? (
                            figmaUrl ? (
                                <iframe src={figmaUrl} className="w-full h-full min-h-[220px]" allowFullScreen />
                            ) : (
                                <div className="absolute inset-0 min-h-[220px] grid place-items-center text-center text-xs text-slate-400 px-4">Paste a valid Figma URL to preview.</div>
                            )
                        ) : looksLikeUrl ? (
                            <iframe src={normalizedEmbedValue} className="w-full h-full min-h-[220px]" allow="fullscreen; clipboard-read; clipboard-write" />
                        ) : (
                            <iframe srcDoc={embedValue} sandbox="allow-scripts allow-same-origin allow-popups" className="w-full h-full min-h-[220px]" />
                        )
                    ) : (
                        <div className="absolute inset-0 min-h-[220px] grid place-items-center text-center text-xs text-slate-400 px-4">
                            {embedVariant === 'figma' ? 'Figma preview appears here.' : 'Embed preview appears here.'}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <div className="p-4 bg-slate-100 rounded-xl text-slate-500 text-sm">Unknown Type</div>;
};

export default BlockRenderer;
