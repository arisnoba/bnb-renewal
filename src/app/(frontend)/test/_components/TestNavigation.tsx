import Link from 'next/link'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

import type { TestNavigationGroup, TestNavigationLink } from './testNavigationData'

export function TestNavigation({ groups }: { groups: TestNavigationGroup[] }) {
  return (
    <NavigationMenu className="z-20 w-full max-w-none justify-start">
      <NavigationMenuList className="flex-wrap justify-start gap-2 space-x-0">
        {groups.map((group) => (
          <NavigationMenuItem key={group.title}>
            <NavigationMenuTrigger>{group.title}</NavigationMenuTrigger>
            <NavigationMenuContent className="p-4">
              <div className="w-[min(88vw,44rem)]">
                <div className="mb-3 border-b border-border pb-3">
                  <p className="text-sm font-semibold">{group.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {group.description}
                  </p>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <TestNavigationLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function TestNavigationLinkItem({ link }: { link: TestNavigationLink }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        className="block rounded-md p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
        href={link.href}
      >
        <span className="block text-sm font-medium">{link.label}</span>
        <span className="mt-1 line-clamp-2 block text-sm leading-5 text-muted-foreground">
          {link.description}
        </span>
        <span className="mt-2 block break-all font-mono text-xs text-muted-foreground">
          {link.href}
        </span>
      </Link>
    </NavigationMenuLink>
  )
}
