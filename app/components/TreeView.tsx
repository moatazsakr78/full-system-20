'use client';

import { 
  PlusIcon, 
  MinusIcon, 
  FolderIcon 
} from '@heroicons/react/24/outline';

export interface TreeNode {
  id: string;
  name: string;
  isExpanded?: boolean;
  children?: TreeNode[];
}

interface TreeViewProps {
  data: TreeNode[];
  onItemClick?: (item: TreeNode) => void;
  onToggle?: (nodeId: string) => void;
  selectedId?: string;
}

interface TreeNodeProps {
  node: TreeNode;
  level?: number;
  onItemClick?: (item: TreeNode) => void;
  onToggle?: (nodeId: string) => void;
  selectedId?: string;
}

const TreeNodeComponent = ({ 
  node, 
  level = 0, 
  onItemClick,
  onToggle,
  selectedId
}: TreeNodeProps) => {
  const hasChildren = node.children && node.children.length > 0;
  
  const handleClick = () => {
    if (hasChildren && onToggle) {
      onToggle(node.id);
    }
    if (onItemClick) {
      onItemClick(node);
    }
  };
  
  return (
    <div>
      <div 
        className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
          selectedId === node.id && !hasChildren
            ? 'bg-blue-600 text-white'
            : 'hover:bg-[#2B3544] text-gray-300 hover:text-white'
        }`}
        style={{ paddingRight: `${12 + level * 20}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 w-full">
          {hasChildren ? (
            <button className="text-gray-400 hover:text-white flex-shrink-0">
              {node.isExpanded ? (
                <MinusIcon className="h-4 w-4" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-3" />
          )}
          
          <FolderIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          
          <span className={`text-base truncate ${
            selectedId === node.id && !hasChildren ? 'text-white' : 'text-gray-300'
          }`}>
            {node.name}
          </span>
        </div>
      </div>
      
      {hasChildren && node.isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id} 
              node={child} 
              level={level + 1} 
              onItemClick={onItemClick}
              onToggle={onToggle}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeView = ({ data, onItemClick, onToggle, selectedId }: TreeViewProps) => {
  return (
    <div className="w-full">
      {data.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          onItemClick={onItemClick}
          onToggle={onToggle}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
};

export default TreeView;