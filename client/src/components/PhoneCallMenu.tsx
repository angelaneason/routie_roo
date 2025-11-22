import { Phone, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PhoneCallMenuProps {
  phoneNumber: string;
  label?: string;
  variant?: "default" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  preferredService?: string;
}

export function PhoneCallMenu({ 
  phoneNumber, 
  label, 
  variant = "ghost",
  size = "sm",
  className = "",
  preferredService = "phone"
}: PhoneCallMenuProps) {
  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  const handleCall = (service?: string) => {
    const serviceToUse = service || preferredService;
    let url = '';
    
    switch (serviceToUse) {
      case 'phone':
        // Regular phone dialer (works on mobile)
        url = `tel:${cleanNumber}`;
        break;
      case 'google-voice':
        // Google Voice web interface
        url = `https://voice.google.com/u/0/calls?a=nc,%2B${cleanNumber}`;
        break;
      case 'whatsapp':
        // WhatsApp calling
        url = `https://wa.me/${cleanNumber}`;
        break;
      case 'skype':
        // Skype calling
        url = `skype:${cleanNumber}?call`;
        break;
      case 'facetime':
        // FaceTime (iOS/macOS)
        url = `facetime:${cleanNumber}`;
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
          <Phone className="h-4 w-4 mr-1" />
          {label || phoneNumber}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => handleCall('phone')}>
          <Phone className="h-4 w-4 mr-2" />
          Phone Dialer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCall('google-voice')}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.8 10.8c.1.3.2.6.2 1 0 1.7-1.3 3-3 3s-3-1.3-3-3 1.3-3 3-3c.8 0 1.5.3 2 .8l1.5-1.5C12.6 7.3 11.4 6.8 10 6.8c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.5 0 4.6-1.8 4.9-4.2h-4.9v-2h7c.1.3.1.7.1 1 0 4.4-3 7.4-7 7.4-4.4 0-8-3.6-8-8s3.6-8 8-8c2.1 0 4 .8 5.5 2.2l-1.5 1.5c-1-1-2.4-1.7-4-1.7-3.3 0-6 2.7-6 6s2.7 6 6 6c3 0 5.5-2.2 5.9-5h-3.1z"/>
          </svg>
          Google Voice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCall('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCall('skype')}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.069 18.874c-4.023 0-5.82-1.979-5.82-3.464 0-.765.561-1.296 1.333-1.296 1.723 0 1.273 2.477 4.487 2.477 1.641 0 2.55-.895 2.55-1.811 0-.551-.269-1.16-1.354-1.429l-3.576-.895c-2.88-.724-3.403-2.286-3.403-3.751 0-3.047 2.861-4.191 5.549-4.191 2.471 0 5.393 1.373 5.393 3.199 0 .784-.688 1.24-1.453 1.24-1.469 0-1.198-2.037-4.164-2.037-1.469 0-2.292.664-2.292 1.617s1.153 1.258 2.157 1.487l2.637.587c2.891.649 3.624 2.346 3.624 3.944 0 2.476-1.902 4.324-5.722 4.324m11.084-4.882l-.029.135-.044-.24c.015.045.044.074.059.12.12-.675.181-1.363.181-2.052 0-1.529-.301-3.012-.898-4.42-.569-1.348-1.395-2.562-2.427-3.596-1.049-1.033-2.247-1.856-3.595-2.426-1.318-.631-2.801-.93-4.328-.93-.72 0-1.444.07-2.143.204l.119.06-.239-.033.119-.025C8.91.274 7.829 0 6.731 0c-1.789 0-3.47.698-4.736 1.967C.729 3.235.032 4.923.032 6.716c0 1.143.292 2.265.844 3.258l.02-.124.041.239-.06-.115c-.114.645-.172 1.299-.172 1.955 0 1.53.3 3.017.884 4.416.568 1.362 1.378 2.576 2.427 3.609 1.034 1.05 2.247 1.857 3.595 2.442 1.394.6 2.877.898 4.404.898.659 0 1.334-.06 1.977-.179l-.119-.062.24.046-.135.03c1.002.569 2.126.871 3.294.871 1.783 0 3.459-.69 4.733-1.963 1.259-1.259 1.962-2.951 1.962-4.749 0-1.138-.299-2.262-.853-3.266"/>
          </svg>
          Skype
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCall('facetime')}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          FaceTime
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
