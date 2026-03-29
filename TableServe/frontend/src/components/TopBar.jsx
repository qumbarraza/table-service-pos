import { NavLink } from 'react-router-dom'
import { usePosStore } from '../store/usePosStore'

function TopBar() {
  const restaurantName = usePosStore((state) => state.restaurantName)

  return (
    <header className="mb-3 rounded-[24px] border border-white/30 bg-white/80 px-4 py-3 shadow-[0_16px_40px_rgba(57,26,8,0.16)] backdrop-blur md:flex md:items-center md:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-terracotta md:text-xs">
          Offline Table Service POS
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-charcoal md:text-[28px]">{restaurantName}</h1>
      </div>
      <nav className="mt-3 flex flex-wrap gap-2 md:mt-0">
        {[
          ['/', 'New Order'],
          ['/reports', 'Reports'],
          ['/settings', 'Settings'],
        ].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `rounded-full px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand-charcoal text-white'
                  : 'bg-brand-sand text-brand-charcoal hover:bg-brand-gold'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default TopBar
