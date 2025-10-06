import React from 'react';

export function Sidebar({ children, className = '', ...props }) {
  return (
    <aside className={`w-72 ${className}`} {...props}>
      {children}
    </aside>
  );
}

export function SidebarContent({ children, className = '', ...props }) { return <div className={className} {...props}>{children}</div> }
export function SidebarHeader({ children, className = '', ...props }) { return <div className={className} {...props}>{children}</div> }
export function SidebarFooter({ children, className = '', ...props }) { return <div className={className} {...props}>{children}</div> }
export function SidebarGroup({ children }) { return <div>{children}</div> }
export function SidebarGroupContent({ children }) { return <div>{children}</div> }
export function SidebarMenu({ children }) { return <ul className="p-0 m-0 list-none">{children}</ul> }
export function SidebarMenuItem({ children }) { return <li>{children}</li> }
export function SidebarMenuButton({ children, asChild, className = '', ...props }) { 
  const Component = asChild ? React.Fragment : 'button';
  return (
    <Component {...props} className={className}>{children}</Component>
  );
}
export function SidebarProvider({ children }) { return <div>{children}</div> }
export function SidebarTrigger(props) { return <button {...props} /> }

export default Sidebar;
