declare module 'next' {
  export interface Metadata {
    title?: string | { default: string; template: string };
    description?: string;
    viewport?: string;
    icons?: string | { icon: string };
    openGraph?: Record<string, any>;
    [key: string]: any;
  }

  export interface NextConfig {
    reactStrictMode?: boolean;
    transpilePackages?: string[];
    images?: {
      remotePatterns?: Array<{
        protocol?: string;
        hostname: string;
        port?: string;
        pathname?: string;
      }>;
      domains?: string[];
      unoptimized?: boolean;
    };
    [key: string]: any;
  }
}

declare module 'next/font/google' {
  export interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    style?: string | string[];
    display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
    variable?: string;
    preload?: boolean;
  }

  export interface FontResult {
    className: string;
    variable: string;
    style: { fontFamily: string };
  }

  export function Inter(options?: FontOptions): FontResult;
  export function Roboto(options?: FontOptions): FontResult;
}

declare module 'next/navigation' {
  export interface AppRouterInstance {
    back(): void;
    forward(): void;
    refresh(): void;
    push(href: string, options?: { scroll?: boolean }): void;
    replace(href: string, options?: { scroll?: boolean }): void;
    prefetch(href: string): void;
  }

  export function useRouter(): AppRouterInstance;
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string>>(): T;
  export function notFound(): never;
  export function redirect(url: string): never;
}

declare module 'next/link' {
  import React from 'react';

  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean;
    passHref?: boolean;
    children?: React.ReactNode;
  }

  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}

declare module 'next/image' {
  import React from 'react';

  export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string | any;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    quality?: number;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    unoptimized?: boolean;
    onLoadingComplete?: (img: HTMLImageElement) => void;
  }

  const Image: React.FC<ImageProps>;
  export default Image;
}
