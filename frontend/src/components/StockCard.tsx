interface StockCardProps {
  label: string;
  value: number;
  variant: 'total' | 'available' | 'reserved' | 'damaged';
  icon?: string;
}

export const StockCard = ({ label, value, variant, icon }: StockCardProps) => {
  const variantClasses = {
    total: 'stock-card-total',
    available: 'stock-card-available',
    reserved: 'stock-card-reserved',
    damaged: 'stock-card-damaged',
  };

  return (
    <div className={`stock-card ${variantClasses[variant]}`}>
      <div className="stock-card-header">
        {icon && <span className="stock-card-icon">{icon}</span>}
        <span className="stock-card-label">{label}</span>
      </div>
      <div className="stock-card-value">{value.toLocaleString('es-MX')}</div>
    </div>
  );
};
