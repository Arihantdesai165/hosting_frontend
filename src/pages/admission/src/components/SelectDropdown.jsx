import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * SelectDropdown — Universal, mobile-safe, accessible dropdown for the Admission Portal.
 *
 * Features:
 *  - Renders options in a portal (position:fixed) — never overflows the screen
 *  - Automatically opens above if not enough space below
 *  - Max 250px height on mobile, 300px on desktop — scrollable
 *  - Searchable when options > 8
 *  - Full keyboard navigation (Arrow Up/Down, Enter, Escape, Home/End)
 *  - Proper ARIA attributes
 *  - Closes on outside click, touchstart, scroll, Escape
 *  - Matches existing input-premium design exactly
 *
 * Props:
 *   value         string   — current selected value
 *   onChange      fn       — (value: string) => void
 *   options       array    — [{ value, label, disabled? }]
 *   placeholder   string
 *   className     string   — extra classes on trigger button
 *   required      bool
 *   disabled      bool
 *   id            string
 *   name          string   — used for the hidden input (form submit)
 *   searchable    bool     — override auto-search detection
 */
const SelectDropdown = ({
    value = '',
    onChange,
    options = [],
    placeholder = 'Select an option...',
    className = '',
    required = false,
    disabled = false,
    id,
    name,
    searchable,
}) => {
    const uid = useId();
    const inputId = id || uid;
    const listId = `${inputId}-list`;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [menuStyle, setMenuStyle] = useState({});

    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const optionRefs = useRef([]);

    const selectedOption = options.find(o => String(o.value) === String(value));
    const autoSearch = searchable !== undefined ? searchable : options.length > 8;

    const validOptions = options.filter(o => !o.disabled);
    const filteredOptions = search
        ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    // ── Position the fixed menu ─────────────────────────────────────────────
    const computeMenuStyle = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isMobile = vw < 768;
        const menuMaxH = isMobile ? 250 : 300;
        const menuW = isMobile ? Math.min(rect.width, vw - 16) : rect.width;
        const left = Math.max(8, Math.min(rect.left, vw - menuW - 8));
        const spaceBelow = vh - rect.bottom - 8;
        const spaceAbove = rect.top - 8;

        let top;
        if (spaceBelow >= Math.min(menuMaxH, 120) || spaceBelow >= spaceAbove) {
            top = rect.bottom + 4;
        } else {
            top = Math.max(8, rect.top - Math.min(menuMaxH, spaceAbove) - 4);
        }

        setMenuStyle({
            position: 'fixed',
            top: `${Math.round(top)}px`,
            left: `${Math.round(left)}px`,
            width: `${Math.round(menuW)}px`,
            maxHeight: `${menuMaxH}px`,
            zIndex: 99999,
        });
    }, []);

    const openMenu = useCallback(() => {
        if (disabled) return;
        setSearch('');
        setFocusedIndex(options.findIndex(o => String(o.value) === String(value)));
        computeMenuStyle();
        setOpen(true);
    }, [disabled, options, value, computeMenuStyle]);

    const closeMenu = useCallback(() => {
        setOpen(false);
        setSearch('');
        setFocusedIndex(-1);
        triggerRef.current?.focus();
    }, []);

    // ── Focus search on open ────────────────────────────────────────────────
    useEffect(() => {
        if (open && autoSearch && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
        if (open && !autoSearch && focusedIndex >= 0) {
            optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [open]); // eslint-disable-line

    // ── Sync focused option into view ───────────────────────────────────────
    useEffect(() => {
        if (open && focusedIndex >= 0) {
            optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [focusedIndex, open]);

    // ── Outside click / scroll / Escape ────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handleOutside = (e) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) {
                closeMenu();
            }
        };
        const handleScroll = () => { if (open) computeMenuStyle(); };
        const handleResize = () => { if (open) computeMenuStyle(); };

        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        window.addEventListener('resize', handleResize);

        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', handleResize);
        };
    }, [open, closeMenu, computeMenuStyle]);

    // ── Keyboard navigation on trigger ─────────────────────────────────────
    const handleTriggerKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            openMenu();
        }
    };

    // ── Keyboard navigation inside menu ────────────────────────────────────
    const handleMenuKeyDown = (e) => {
        const displayedOptions = filteredOptions;
        const enabledIndices = displayedOptions
            .map((o, i) => (!o.disabled ? i : -1))
            .filter(i => i !== -1);

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                closeMenu();
                break;
            case 'ArrowDown': {
                e.preventDefault();
                const next = enabledIndices.find(i => i > focusedIndex) ?? enabledIndices[0];
                setFocusedIndex(next ?? focusedIndex);
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                const prev = [...enabledIndices].reverse().find(i => i < focusedIndex) ?? enabledIndices[enabledIndices.length - 1];
                setFocusedIndex(prev ?? focusedIndex);
                break;
            }
            case 'Home':
                e.preventDefault();
                setFocusedIndex(enabledIndices[0] ?? 0);
                break;
            case 'End':
                e.preventDefault();
                setFocusedIndex(enabledIndices[enabledIndices.length - 1] ?? 0);
                break;
            case 'Enter': {
                e.preventDefault();
                if (focusedIndex >= 0 && displayedOptions[focusedIndex] && !displayedOptions[focusedIndex].disabled) {
                    handleSelect(displayedOptions[focusedIndex].value);
                }
                break;
            }
            case 'Tab':
                closeMenu();
                break;
            default:
                break;
        }
    };

    const handleSelect = (val) => {
        onChange(val);
        closeMenu();
    };

    // ── Render ──────────────────────────────────────────────────────────────
    const menuContent = open ? (
        <div
            ref={menuRef}
            role="listbox"
            id={listId}
            aria-label={placeholder}
            style={menuStyle}
            className="select-dropdown-menu bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col"
            onKeyDown={handleMenuKeyDown}
            tabIndex={autoSearch ? -1 : 0}
        >
            {/* Search bar */}
            {autoSearch && (
                <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white z-10">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setFocusedIndex(0); }}
                        onKeyDown={handleMenuKeyDown}
                        placeholder="Search..."
                        className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
                        aria-label="Search options"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="text-slate-400 hover:text-slate-600"
                            tabIndex={-1}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* Options list */}
            <div className="overflow-y-auto overscroll-contain flex-1" style={{ maxHeight: 'inherit' }}>
                {filteredOptions.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400 italic">No options found</div>
                ) : (
                    filteredOptions.map((opt, idx) => {
                        const isSelected = String(opt.value) === String(value);
                        const isFocused = idx === focusedIndex;
                        return (
                            <div
                                key={opt.value}
                                ref={el => { optionRefs.current[idx] = el; }}
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={!!opt.disabled}
                                onClick={() => !opt.disabled && handleSelect(opt.value)}
                                onMouseEnter={() => !opt.disabled && setFocusedIndex(idx)}
                                className={[
                                    'flex items-center justify-between px-4 py-3 min-h-[44px] text-sm cursor-pointer transition-colors select-none',
                                    opt.disabled ? 'text-slate-300 cursor-not-allowed opacity-60' : '',
                                    isSelected ? 'bg-primary-50 text-primary-700 font-semibold' : '',
                                    isFocused && !isSelected && !opt.disabled ? 'bg-slate-50 text-slate-900' : '',
                                    !isSelected && !isFocused && !opt.disabled ? 'text-slate-700 hover:bg-slate-50' : '',
                                    opt.value === '' ? 'text-slate-400 italic' : '',
                                ].filter(Boolean).join(' ')}
                            >
                                <span className="text-sm flex-1 break-words whitespace-normal leading-snug">{opt.label}</span>
                                {isSelected && opt.value !== '' && (
                                    <Check size={14} className="shrink-0 ml-2 text-primary-600" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    ) : null;

    return (
        <div className="relative w-full">
            {/* Hidden native input for required/form validation */}
            <input
                type="text"
                name={name}
                id={inputId}
                required={required}
                value={value || ''}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            />

            {/* Visible trigger button */}
            <button
                type="button"
                ref={triggerRef}
                onClick={open ? closeMenu : openMenu}
                onKeyDown={handleTriggerKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                aria-required={required}
                aria-disabled={disabled}
                className={[
                    'input-premium min-h-[44px] py-2.5 px-3.5 h-auto flex items-center justify-between gap-2 cursor-pointer text-left w-full max-w-full box-border',
                    !value ? 'text-slate-400' : 'text-slate-900 font-medium',
                    disabled ? 'opacity-50 cursor-not-allowed' : '',
                    open ? 'border-primary-600 ring ring-[rgba(18,65,161,0.12)]' : '',
                    className,
                ].filter(Boolean).join(' ')}
            >
                <span className="text-sm flex-1 min-w-0 break-words whitespace-normal leading-tight">
                    {selectedOption ? selectedOption.label : <span className="text-slate-400">{placeholder}</span>}
                </span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Portal-rendered menu */}
            {typeof document !== 'undefined' && createPortal(menuContent, document.body)}
        </div>
    );
};

export default SelectDropdown;
