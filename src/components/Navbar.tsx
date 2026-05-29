import React from 'react';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import logo from '../assets/My_logo/Frame 16.png';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onCartClick,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const categories = [
    { id: 'all', label: 'All Divine Items' },
    { id: 'kits', label: 'Puja Kits' },
    { id: 'idols', label: 'Deity Idols' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'books', label: 'Sacred Books' },
    { id: 'incense', label: 'Incense & Fragrance' },
  ];

  return (
    <nav className="glass sticky-nav fade-in-entry" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '16px 0',
      transition: 'all var(--transition-normal)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Top Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src={logo} 
              alt="Mantra Puja Logo" 
              style={{ 
                height: '65px', 
                objectFit: 'contain'
              }} 
            />
          </div>

          {/* Search Bar (Desktop) */}
          <div style={{
            position: 'relative',
            flex: '0 1 400px',
            display: 'none',
            alignItems: 'center'
          }} className="desktop-search">
            <input
              type="text"
              placeholder="Search sacred kits, idols, incense..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 42px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem',
                transition: 'border-color var(--transition-fast)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-gold)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <Search size={18} style={{
              position: 'absolute',
              left: '16px',
              color: 'var(--text-secondary)'
            }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Shopping Cart */}
            <button
              onClick={onCartClick}
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary-deep)',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'var(--primary-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="pulse-gold-anim" style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--primary-accent)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                padding: '8px',
                display: 'none',
                color: 'var(--primary-deep)'
              }}
              className="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Search Bar (Mobile) */}
        <div style={{
          position: 'relative',
          display: 'none',
          alignItems: 'center',
          marginTop: '4px'
        }} className="mobile-search">
          <input
            type="text"
            placeholder="Search sacred items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 42px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
          <Search size={18} style={{
            position: 'absolute',
            left: '16px',
            color: 'var(--text-secondary)'
          }} />
        </div>

        {/* Categories Bar */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '8px',
          padding: '4px 0',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }} className="categories-scroll">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onCategorySelect(cat.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                  border: isActive ? '1px solid var(--primary-accent)' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(217, 119, 6, 0.08))'
                    : 'transparent',
                  color: isActive ? 'var(--primary-accent)' : 'var(--text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CSS injection for responsive adjustments */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-search {
            display: flex !important;
          }
        }
        @media (max-width: 767px) {
          .mobile-search {
            display: flex !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
          }
        }
        .categories-scroll::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
      `}</style>
    </nav>
  );
};
