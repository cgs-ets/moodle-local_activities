import { statuses } from '../utils';
import { cn } from '../utils/utils';


export function StatusDot({status}: {status: number}) {
  return (
    <div className={cn("size-2 rounded-full min-w-2 mt-1", status == statuses.approved 
      ? "bg-[#4aa15d]" 
      : status == statuses.saved 
        ? "bg-gray-400"
        : "bg-[#ffa94d]")}>
    </div>
  );
};