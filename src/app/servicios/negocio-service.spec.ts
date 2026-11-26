import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { InicioNegocio } from '../modelo/negocio';
import { NegocioService } from './negocio-service';

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
  proximos_vencimientos: [],
  clientes_en_mora: [],
};

describe('NegocioService', () => {
  let service: NegocioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NegocioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('obtiene el dashboard de inicio desde GET /negocio/inicio', () => {
    let respuesta: InicioNegocio | undefined;
    service.obtenerInicio().subscribe((r) => (respuesta = r));

    const req = http.expectOne(`${environment.apiUrl}/negocio/inicio`);
    expect(req.request.method).toBe('GET');
    req.flush(INICIO_MOCK);
    expect(respuesta).toEqual(INICIO_MOCK);
  });
});
