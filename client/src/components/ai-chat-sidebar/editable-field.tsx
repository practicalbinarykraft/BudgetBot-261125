import { Input } from '@/components/ui/input';

interface EditableFieldProps {
  label: string;
  value: string | number;
  type?: 'text' | 'number';
  onChange: (value: string | number) => void;
  testId?: string;
}

export function EditableField({ 
  label, 
  value, 
  type = 'text', 
  onChange,
  testId 
}: EditableFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      const parsed = parseFloat(e.target.value);
      onChange(isNaN(parsed) ? 0 : parsed);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground capitalize text-xs">
        {label}:
      </span>
      <Input
        type={type}
        value={value}
        onChange={handleChange}
        className="h-8 text-sm"
        data-testid={testId || `input-${label.toLowerCase()}`}
      />
    </div>
  );
}
