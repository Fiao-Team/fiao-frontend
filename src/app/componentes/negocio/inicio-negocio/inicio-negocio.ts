import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { dinero, fecha } from '../../../modelo/formato';
import { InicioNegocio } from '../../../modelo/negocio';
import { Moneda } from '../../../modelo/venta';
import { NegocioService } from '../../../servicios/negocio-service';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';

/**
 * Dashboard Inicio del Administrador del negocio (Fig. 6, pseudocódigo 4.4).
 * Consume GET /negocio/inicio con totales separados por moneda (PEN / USD).
 */
@Component({
  selector: 'app-inicio-negocio',
  imports: [RouterLink, ComoUsar, Icono],
  templateUrl: './inicio-negocio.html',
  styleUrl: './inicio-negocio.css',
})
export class InicioNegocioComponente implements OnInit {
  private readonly negocio = inject(NegocioService);

  protected readonly datos = signal<InicioNegocio | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly fecha = fecha;

  protected readonly pasos = [
    'Revisa las tarjetas superiores para ver tu total por cobrar (separado en soles y dólares), clientes en mora, vencimientos de la semana y crédito otorgado este mes.',
    'En "Próximos vencimientos" identifica rápidamente qué clientes están en mora o tienen pagos cercanos.',
    'Usa el panel "Clientes en mora" para priorizar cobros según los días de atraso.',
    'Presiona "+ Nueva venta" para registrar una nueva venta al crédito.',
  ];

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.negocio.obtenerInicio().subscribe({
      next: (r) => {
        this.datos.set(r);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.'
            : (e.error?.detail ?? 'No se pudo cargar el resumen del negocio.'),
        );
      },
    });
  }

  protected monto(moneda: Moneda, valor: string | number): string {
    return dinero(moneda, String(valor));
  }

  protected esPositivo(valor: string | number): boolean {
    return Number(valor) > 0;
  }
}
