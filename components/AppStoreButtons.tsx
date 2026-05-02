import { APP_STORE_URLS } from '@/lib/seo/app-pages'

interface Props {
  variant?: 'light' | 'dark'
  className?: string
}

export default function AppStoreButtons({ variant = 'light', className = '' }: Props) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <a
        href={APP_STORE_URLS.ios}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bereifung24 im App Store laden"
        className="transition-transform hover:scale-105"
      >
        <img
          src="/logos/app-store-badge.svg"
          alt="Download im App Store"
          height={48}
          className="h-12 w-auto"
        />
      </a>
      <a
        href={APP_STORE_URLS.android}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bereifung24 bei Google Play laden"
        className="transition-transform hover:scale-105"
      >
        <img
          src="/logos/google-play-badge.png"
          alt="Jetzt bei Google Play"
          height={70}
          className="h-[63px] w-auto -my-2"
        />
      </a>
    </div>
  )
}
