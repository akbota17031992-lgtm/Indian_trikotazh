'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ArrowRight, MapPin, ShieldCheck, Printer } from 'lucide-react';
import { useLocale } from '../../../contexts/LocaleContext';
import { useBranch } from '../../../contexts/BranchContext';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Badge } from '@india-trikotaj/ui';

interface OrderConfirmationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const resolved = use(params);
  const orderId = resolved.id;
  const { locale, t } = useLocale();
  const { selectedBranch } = useBranch();

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="text-center pb-4 pt-8 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-foreground">
              {t('orderConfirmed')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t('thankYouMessage')}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2 text-sm">
          {/* Order Details Bar */}
          <div className="p-4 bg-muted/40 rounded-xl border border-border/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {locale === 'kz' ? 'Тапсырыс нөмірі:' : 'Номер заказа:'}
              </span>
              <span className="font-mono font-bold text-foreground">{orderId}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {locale === 'kz' ? 'Төлем мәртебесі:' : 'Статус оплаты:'}
              </span>
              <Badge variant="default" className="text-[10px] bg-emerald-600 hover:bg-emerald-600">
                {t('orderStatusPaid')} (Kaspi Pay)
              </Badge>
            </div>
          </div>

          {/* Pickup / Delivery Notice */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-foreground">
                  {locale === 'kz'
                    ? `${selectedBranch.nameKz} дүкенінен алып кету`
                    : `Самовывоз: ${selectedBranch.nameRu}`}
                </span>
                <p className="text-muted-foreground">
                  {locale === 'kz' ? selectedBranch.addressKz : selectedBranch.addressRu}
                </p>
                <p className="text-muted-foreground/80">
                  {locale === 'kz' ? selectedBranch.openHoursKz : selectedBranch.openHoursRu}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {locale === 'kz'
                ? 'Тапсырыс мәліметтері мен түбіртек SMS арқылы телефон нөміріңізге жіберілді.'
                : 'Детали заказа и фискальный чек отправлены по SMS на указанный номер телефона.'}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-6 flex flex-col sm:flex-row gap-3">
          <Link href="/catalog" className="w-full">
            <Button size="lg" className="w-full font-bold h-11 text-xs flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{t('continueShopping')}</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="w-full sm:w-auto font-medium h-11 text-xs flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>{locale === 'kz' ? 'Басып шығару' : 'Печать чека'}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
