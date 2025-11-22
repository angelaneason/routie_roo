import { MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cleanPhoneNumber, formatUSPhoneNumber } from "@shared/phoneFormat";

interface PhoneTextMenuProps {
  phoneNumber: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function PhoneTextMenu({ 
  phoneNumber, 
  label,
  variant = "outline",
  size = "default",
  className = ""
}: PhoneTextMenuProps) {
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  const displayNumber = formatUSPhoneNumber(phoneNumber);
  
  const handleText = (service: string) => {
    let url = '';
    
    switch (service) {
      case 'sms':
        // SMS text message
        url = `sms:${cleanNumber}`;
        break;
      case 'whatsapp':
        // WhatsApp text message
        url = `https://wa.me/${cleanNumber}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          {label || displayNumber}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => handleText('sms')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          SMS Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleText('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
