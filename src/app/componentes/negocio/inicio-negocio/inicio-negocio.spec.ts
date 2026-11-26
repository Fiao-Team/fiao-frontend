import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { InicioNegocio } from '../../../modelo/negocio';
import { InicioNegocioComponente } from './inicio-negocio';

const INICIO_MOCK: InicioNegocio = {
  tienda_id: 1,
  nombre_comercial: 'Bodega Don Pepe',
  clientes_activos: 4,
  total_por_cobrar_pen: '1250.50',
  total_por_cobrar_usd: '120.00',
  clientes_en_mora_count: 1,
  vencen_esta_semana_count: 2,
  vencen_esta_semana_pen: '310.00',
  vencen_esta_semana_usd: '0.00',
  credito_este_mes_pen: '890.00',
  credito_este_mes_usd: '0.00',
  ventas_este_mes_count: 5,
  proximos_vencimientos: [
    {
      cliente_id: 2,
      nombres_apellidos: 'Carlos Mendoza',
      moneda: 'PEN',
      monto: '295.81',
      fecha_pago: '2026-09-26',
      situacion: 'EN_MORA',
      dias_mora: 8,
    },
    {
      cliente_id: 1,
      nombres_apellidos: 'Rosa Díaz',
      moneda: 'PEN',
      monto: '45.36',
      fecha_pago: '2026-10-26',
      situacion: 'CON_DEUDA',
      dias_mora: 0,
    },
  ],
  clientes_en_mora: [
    {
      cliente_id: 2,
      nombres_apellidos: 'Carlos Mendoza',
      moneda: 'PEN',
      dias_atraso: 8,
      monto_vencido: '295.81',
    },
  ],
};

describe('InicioNegocioComponente', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioNegocioComponente],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('muestra los KPIs separados por moneda, próximos vencimientos y clientes en mora', () => {
    const fixture = TestBed.createComponent(InicioNegocioComponente);
    fixture.detectChanges();

    http.expectOne(`${environment.apiUrl}/negocio/inicio`).flush(INICIO_MOCK);
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Bodega Don Pepe');
    expect(texto).toContain('S/ 1,250.50');
    expect(texto).toContain('US$ 120.00');
    expect(texto).toContain('Carlos Mendoza');
    expect(texto).toContain('En mora (8 d)');
    expect(texto).toContain('Rosa Díaz');
    expect(texto).toContain('8 días de atraso');
  });
});
