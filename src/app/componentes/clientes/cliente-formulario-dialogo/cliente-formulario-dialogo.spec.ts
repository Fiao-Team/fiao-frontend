import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { ClienteItem } from '../../../modelo/cliente';
import { ClienteFormularioDialogo } from './cliente-formulario-dialogo';

const CLIENTE_EXISTENTE: ClienteItem = {
  cliente_id: 5,
  dni: '41928653',
  nombres_apellidos: 'Rosa Díaz',
  telefono: '987654321',
  direccion: 'Jr. Las Flores 215',
  username: 'rosa',
  email: 'rosa@correo.pe',
  moneda: 'PEN',
  limite_credito: '500.00',
  saldo_deudor: '0.00',
  disponible: '500.00',
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
};

describe('ClienteFormularioDialogo', () => {
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
      imports: [ClienteFormularioDialogo],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('consulta la vista previa BCRP al abrir el modal y muestra las TEA calculadas', () => {
    const fixture = TestBed.createComponent(ClienteFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirCrear();
    const req = http.expectOne(`${baseUrl}/vista-previa-tasas`);
    req.flush({
      moneda: 'PEN',
      tea_comp_porcentaje: '30.0000000',
      tea_mora_porcentaje: '5.0000000',
      tasa_max_comp_bcrp: '114.1300000',
      tasa_max_mora_bcrp: '17.1195000',
      cumple_bcrp: true,
    });
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Cumple los topes vigentes del BCRP');
    expect(texto).toContain('30.0000000 %');
  });

  it('rechaza localmente cuando día de pago es igual a día de corte', () => {
    const fixture = TestBed.createComponent(ClienteFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirCrear();
    http.expectOne(`${baseUrl}/vista-previa-tasas`).flush({
      moneda: 'PEN',
      tea_comp_porcentaje: '30.0000000',
      tea_mora_porcentaje: '5.0000000',
      tasa_max_comp_bcrp: '114.1300000',
      tasa_max_mora_bcrp: '17.1195000',
      cumple_bcrp: true,
    });

    (comp as any).formulario.patchValue({
      nombres_apellidos: 'Rosa Díaz',
      dni: '41928653',
      telefono: '987654321',
      direccion: 'Jr. Las Flores 215',
      username: 'rosa',
      password: 'ClaveSegura123',
      limite_credito: '500',
      dia_corte: 20,
      dia_pago: 20,
    });
    (comp as any).guardar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El día de pago debe ser distinto al día de corte.');
    http.expectNone(baseUrl);
  });

  it('mapea rechazo por tope BCRP del backend (HTTP 400)', () => {
    const fixture = TestBed.createComponent(ClienteFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirCrear();
    http.expectOne(`${baseUrl}/vista-previa-tasas`).flush({
      moneda: 'PEN',
      tea_comp_porcentaje: '30.0000000',
      tea_mora_porcentaje: '5.0000000',
      tasa_max_comp_bcrp: '114.1300000',
      tasa_max_mora_bcrp: '17.1195000',
      cumple_bcrp: true,
    });

    (comp as any).formulario.patchValue({
      nombres_apellidos: 'Rosa Díaz',
      dni: '41928653',
      telefono: '987654321',
      direccion: 'Jr. Las Flores 215',
      username: 'rosa',
      password: 'ClaveSegura123',
      limite_credito: '500',
      tasa_compensatoria: '150',
    });
    (comp as any).guardar();

    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush(
      {
        detail: 'La tasa supera la tasa máxima vigente',
        errores: { tasa_compensatoria: 'La tasa supera la tasa máxima vigente (114.13 % TEA).' },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('114.13 % TEA');
  });

  it('edita un cliente existente con PUT /clientes/{id}', () => {
    const fixture = TestBed.createComponent(ClienteFormularioDialogo);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    let actualizado: ClienteItem | undefined;
    comp.guardado.subscribe((c) => (actualizado = c));

    comp.abrirEditar(CLIENTE_EXISTENTE);
    http.expectOne(`${baseUrl}/vista-previa-tasas`).flush({
      moneda: 'PEN',
      tea_comp_porcentaje: '30.0000000',
      tea_mora_porcentaje: '5.0000000',
      tasa_max_comp_bcrp: '114.1300000',
      tasa_max_mora_bcrp: '17.1195000',
      cumple_bcrp: true,
    });

    (comp as any).formulario.controls.limite_credito.setValue('800');
    (comp as any).guardar();

    const req = http.expectOne(`${baseUrl}/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.limite_credito).toBe('800.00');
    req.flush({ ...CLIENTE_EXISTENTE, limite_credito: '800.00', disponible: '800.00' });

    expect(actualizado?.limite_credito).toBe('800.00');
  });
});
