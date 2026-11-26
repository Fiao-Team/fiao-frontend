import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { TiendaListadoSalida } from '../../../modelo/tienda';
import { Tiendas } from './tiendas';

const LISTADO_MOCK: TiendaListadoSalida = {
  resumen: { total: 2, activas: 1, inactivas: 1 },
  giros: ['Bodega', 'Pollería'],
  tiendas: [
    {
      tienda_id: 1,
      nombre_comercial: 'Bodega Don Pepe',
      razon_social: null,
      ruc: '20123456789',
      giro: 'Bodega',
      direccion: 'Av. Universitaria 1200',
      distrito: 'Los Olivos',
      telefono: '987654321',
      dueno_dni: '40123456',
      dueno_nombres: 'José Ramírez',
      dueno_email: 'pepe@bodega.pe',
      dueno_username: 'donpepe',
      moneda_defecto: 'PEN',
      logo_url: null,
      estado: 1,
      clientes_count: 5,
    },
    {
      tienda_id: 2,
      nombre_comercial: 'Pollería El Sabor',
      razon_social: null,
      ruc: '20678912345',
      giro: 'Pollería',
      direccion: 'Av. Izaguirre 300',
      distrito: 'Independencia',
      telefono: '912345678',
      dueno_dni: '41234567',
      dueno_nombres: 'Luis Pérez',
      dueno_email: 'luis@elsabor.pe',
      dueno_username: 'elsabor',
      moneda_defecto: 'PEN',
      logo_url: null,
      estado: 0,
      clientes_count: 1,
    },
  ],
};

describe('Tiendas', () => {
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/tiendas`;

  beforeEach(async () => {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
      };
    }

    await TestBed.configureTestingModule({
      imports: [Tiendas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('carga KPIs, tabla de tiendas y acciones por estado', () => {
    const fixture = TestBed.createComponent(Tiendas);
    fixture.detectChanges();

    const req = http.expectOne(baseUrl);
    req.flush(LISTADO_MOCK);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const valoresKpi = Array.from(el.querySelectorAll('.kpi-valor')).map((n) => n.textContent?.trim());
    expect(valoresKpi).toEqual(['2', '1', '1']);

    const filas = el.querySelectorAll('tbody tr');
    expect(filas.length).toBe(2);
    expect(el.textContent).toContain('Bodega Don Pepe');
    expect(el.textContent).toContain('Pollería El Sabor');
    expect(el.querySelector('button[aria-label="Dar de baja Bodega Don Pepe"]')).toBeTruthy();
    expect(el.querySelector('button[aria-label="Reactivar Pollería El Sabor"]')).toBeTruthy();
  });

  it('vuelve a consultar al cambiar los filtros de giro y estado', () => {
    const fixture = TestBed.createComponent(Tiendas);
    fixture.detectChanges();
    http.expectOne(baseUrl).flush(LISTADO_MOCK);
    fixture.detectChanges();

    const selectEstado: HTMLSelectElement = fixture.nativeElement.querySelector('#f-estado');
    selectEstado.value = 'INACTIVA';
    selectEstado.dispatchEvent(new Event('change'));

    const reqEstado = http.expectOne((r) => r.url === baseUrl && r.params.get('estado') === 'INACTIVA');
    reqEstado.flush({
      ...LISTADO_MOCK,
      tiendas: [LISTADO_MOCK.tiendas[1]],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Pollería El Sabor');
  });
});
