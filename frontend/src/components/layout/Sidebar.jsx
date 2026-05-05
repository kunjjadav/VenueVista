import SearchBar from '../panels/SearchBar'
import FilterPanel from '../panels/FilterPanel'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <SearchBar />
      </div>
      <FilterPanel />
    </aside>
  )
}
