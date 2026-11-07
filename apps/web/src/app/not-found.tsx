import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-lg text-center space-y-4">
      <div className="text-6xl font-black text-primary">404</div>
      <h2 className="text-xl font-bold text-foreground">Страница не найдена / Бет табылмады</h2>
      <p className="text-xs text-muted-foreground">
        Запрашиваемая страница каталога не существует или была перемещена.
      </p>
      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
