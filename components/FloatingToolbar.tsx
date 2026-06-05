import React from 'react';
import {
    Layout, Edit3, Type, Image as ImageIcon, Video,
    FolderPlus, Code, Briefcase, List, Link as LinkIcon
} from 'lucide-react';
import { ContentType } from '../types';

interface FloatingToolbarProps {
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onAddItem: (type: ContentType) => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ isEditMode, onToggleEditMode, onAddItem }) => {
    return (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
            {/* Animated Add Content Menu */}
            <div
                className={`
                    flex items-center bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-full px-2
                    transition-all duration-300 ease-out origin-right overflow-hidden
                    ${isEditMode ? 'max-w-[600px] opacity-100 translate-x-0 py-2' : 'max-w-0 opacity-0 translate-x-8 py-0 border-0'}
                `}
            >
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button onClick={() => onAddItem('project')} className="p-3 rounded-full hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors flex flex-col items-center gap-1 min-w-[4rem]" title="Project">
                        <FolderPlus size={20} />
                        <span className="text-[10px] font-medium">Project</span>
                    </button>
                    <div className="w-px h-8 bg-slate-200 mx-1 flex-shrink-0"></div>
                    <button onClick={() => onAddItem('text')} className="p-3 rounded-full hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors flex flex-col items-center gap-1 min-w-[3.5rem]" title="Text">
                        <Type size={20} />
                        <span className="text-[10px] font-medium">Text</span>
                    </button>
                    <button onClick={() => onAddItem('image')} className="p-3 rounded-full hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors flex flex-col items-center gap-1 min-w-[3.5rem]" title="Image">
                        <ImageIcon size={20} />
                        <span className="text-[10px] font-medium">Image</span>
                    </button>
                    <button onClick={() => onAddItem('video')} className="p-3 rounded-full hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors flex flex-col items-center gap-1 min-w-[3.5rem]" title="Video">
                        <Video size={20} />
                        <span className="text-[10px] font-medium">Video</span>
                    </button>
                    <button onClick={() => onAddItem('code')} className="p-3 rounded-full hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors flex flex-col items-center gap-1 min-w-[3.5rem]" title="Code">
                        <Code size={20} />
                        <span className="text-[10px] font-medium">Code</span>
                    </button>
                    <button onClick={() => onAddItem('service')} className="p-3 rounded-full hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors flex flex-col items-center gap-1 min-w-[3.5rem]" title="Service">
                        <Briefcase size={20} />
                        <span className="text-[10px] font-medium">Service</span>
                    </button>
                    <button onClick={() => onAddItem('collapsible')} className="p-3 rounded-full hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors flex flex-col items-center gap-1 min-w-[3.5rem]" title="Section">
                        <List size={20} />
                        <span className="text-[10px] font-medium">List</span>
                    </button>
                    <button onClick={() => onAddItem('link')} className="p-3 rounded-full hover:bg-brand-50 text-slate-600 hover:text-brand-600 transition-colors flex flex-col items-center gap-1 min-w-[3.5rem]" title="Link">
                        <LinkIcon size={20} />
                        <span className="text-[10px] font-medium">Link</span>
                    </button>
                </div>
            </div>

            {/* Edit/Done Toggle */}
            <button
                onClick={onToggleEditMode}
                className={`
                    flex items-center gap-2 px-6 py-4 rounded-full shadow-xl transition-all duration-300 font-medium tracking-wide whitespace-nowrap
                    ${isEditMode
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95'
                        : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 hover:scale-105 active:scale-95'}
                `}
            >
                {isEditMode ? <><Layout size={20} /> Done</> : <><Edit3 size={20} /> Edit Page</>}
            </button>
        </div>
    );
};

export default FloatingToolbar;
