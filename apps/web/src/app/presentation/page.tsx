import React from 'react';
import Link from 'next/link';

export default function PresentationPage() {
  return (
    <div className="w-full h-screen bg-neutral-900 flex flex-col">
      <div className="h-12 bg-neutral-950 px-6 flex items-center justify-between border-b border-neutral-800 text-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors text-xs">
            ← Вернуться в магазин
          </Link>
          <span className="text-neutral-600">|</span>
          <span className="font-bold text-amber-400 text-xs uppercase tracking-wider">
            Инвестиционная презентация для заказчика (Алматы)
          </span>
        </div>
        <div className="text-xs text-neutral-400">
          Используйте стрелки <strong>← / →</strong> или Пробел на клавиатуре
        </div>
      </div>
      <iframe
        src="/presentation.html"
        className="w-full flex-1 border-0"
        title="Презентация для заказчика"
      />
    </div>
  );
}

