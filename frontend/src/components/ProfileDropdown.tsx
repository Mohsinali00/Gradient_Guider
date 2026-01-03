import { useRef, useEffect } from 'react';

interface ProfileDropdownProps {
  onClose: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
}

export default function ProfileDropdown({ onClose, onProfileClick, onLogout }: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
    >
      <div className="py-1">
        <button
          onClick={() => {
            onProfileClick();
            onClose();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          My Profile
        </button>
        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

