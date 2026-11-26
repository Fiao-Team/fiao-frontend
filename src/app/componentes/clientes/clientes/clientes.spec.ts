import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { ClienteItem } from '../../../modelo/cliente';
import { Clientes } from './clientes';

const CLIENTES_MOCK: ClienteItem[] = [
  {
    cliente_id: 1,
    dni: '41928653',
    nombres_apellidos: 'Rosa Díaz',
    telefono: '987654321',
    direccion: 'Jr. Las Flores 215',
    username: 'rosa',
    email: 'rosa@correo.pe',
    moneda: 'PEN',
    limite_credito: '500.00',
    saldo_deudor: '255.00',
    disponible: '245.00',
    plazo_max_meses: 6,
    dia_corte: 20,
    hora_corte: '23:59:00',
    dia_pago: 26,
    tipo_tasa_comp: 'EFECTIVA',
    tasa_compensatoria: '30.00',
    periodo_tasa_comp: 'ANUAL',
    capitalizacion_comp: null,
    tea_comp_porcentaje: '30.0000000',
    tipo_tasa_mora: 'EFECTIVA',
    tasa_moratoria: '5.00',
    periodo_tasa_mora: 'ANUAL',
    capitalizacion_mora: null,
    tea_mora_porcentaje: '5.0000000',
    estado: 1,
  },
  {
    cliente_id: 2,
    dni: '42345678',
    nombres_apellidos: 'Luis Ramos',
    telefono: '912345678',
    direccion: 'Av. Los Próceres 100',
    username: 'luis',
    email: null,
    moneda: 'USD',
    limite_credito: '300.00',
    saldo_deudor: '0.00',
    disponible: '300.00',
    plazo_max_meses: 4,
    dia_corte: 25,
    hora_corte: '23:59:00',
    dia_pago: 10,
    tipo_tasa_comp: 'EFECTIVA',
    tasa_compensatoria: '2.00',
    periodo_tasa_comp: 'MENSUAL',
    capitalizacion_comp: null,
    tea_comp_porcentaje: '26.8241795',
    tipo_tasa_mora: 'EFECTIVA',
    tasa_moratoria: '5.00',
    periodo_tasa_mora: 'ANUAL',
    capitalizacion_mora: null,
    tea_mora_porcentaje: '5.0000000',
    estado: 0,
  },
];

describe('Clientes', () => {
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/clientes`;

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
      imports: [Clientes],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('muestra clientes con límite, usado, disponible, TEA y acciones por estado', () => {
    const fixture = TestBed.createComponent(Clientes);
    fixture.detectChanges();

    http.expectOne(baseUrl).flush(CLIENTES_MOCK);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.textContent).toContain('Rosa Díaz');
    expect(el.textContent).toContain('S/ 500.00');
    expect(el.textContent).toContain('S/ 245.00');
    expect(el.textContent).toContain('US$ 300.00');
    expect(el.querySelector('button[aria-label="Dar de baja Rosa Díaz"]')).toBeTruthy();
    expect(el.querySelector('button[aria-label="Reactivar Luis Ramos"]')).toBeTruthy();
  });

  it('impide dar de baja en el modal cuando el cliente tiene saldo deudor > 0 (Fig. 12)', () => {
    const fixture = TestBed.createComponent(Clientes);
    fixture.detectChanges();
    http.expectOne(baseUrl).flush([CLIENTES_MOCK[0]]);
    fixture.detectChanges();

    const btnBaja: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Dar de baja Rosa Díaz"]',
    );
    btnBaja.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El cliente tiene deuda pendiente');
  });

  it('envía solo_activos=false y moneda al cambiar los filtros', () => {
    const fixture = TestBed.createComponent(Clientes);
    fixture.detectChanges();
    http.expectOne(baseUrl).flush([CLIENTES_MOCK[0]]);
    fixture.detectChanges();

    const check: HTMLInputElement = fixture.nativeElement.querySelector('#fc-inactivos');
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    http.expectOne((r) => r.url === baseUrl && r.params.get('solo_activos') === 'false').flush(CLIENTES_MOCK);

    const selectMoneda: HTMLSelectElement = fixture.nativeElement.querySelector('#fc-moneda');
    selectMoneda.value = 'USD';
    selectMoneda.dispatchEvent(new Event('change'));
    http
      .expectOne((r) => r.url === baseUrl && r.params.get('moneda') === 'USD' && r.params.get('solo_activos') === 'false')
      .flush([CLIENTES_MOCK[1]]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Luis Ramos');
  });
});
