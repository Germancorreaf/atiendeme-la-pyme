#!/usr/bin/env python3
"""
Aplica la pagina de Terminos y Condiciones a src/index.js:
1. Inserta la constante TERMS_OF_SERVICE (antes de PRIVACY_POLICY)
2. Agrega la ruta /terminos en el router
3. Cambia el link del footer de "#" a "/terminos"
4. Agrega /terminos al sitemap.xml
5. Agrega /terminos al llms.txt

Correr desde la raiz del repo (donde esta src/index.js):
    python3 apply_terminos.py
"""
import base64
import sys

TERMS_B64 = "PCFET0NUWVBFIGh0bWw+PGh0bWwgbGFuZz0iZXMiPjxoZWFkPjxtZXRhIGNoYXJzZXQ9IlVURi04Ij48bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEiPjx0aXRsZT5Uw6lybWlub3MgeSBDb25kaWNpb25lcyDigJQgQXRpw6luZGVtZSBsYSBQeW1lPC90aXRsZT48c3R5bGU+OnJvb3R7LS1iZzojMEEwQTBBOy0tdGV4dDojRURFREU4Oy0tYWNjZW50OiNFOEEzM0Q7LS1tdXRlZDojOEE4QTgyO30qe2JveC1zaXppbmc6Ym9yZGVyLWJveDttYXJnaW46MDtwYWRkaW5nOjA7fWJvZHl7YmFja2dyb3VuZDp2YXIoLS1iZyk7Y29sb3I6dmFyKC0tdGV4dCk7Zm9udC1mYW1pbHk6J0pldEJyYWlucyBNb25vJyxtb25vc3BhY2U7bGluZS1oZWlnaHQ6MS42O30uY29udGFpbmVye21heC13aWR0aDo4MDBweDttYXJnaW46MCBhdXRvO3BhZGRpbmc6NDBweCAyMHB4O31oMXtmb250LXNpemU6MzJweDttYXJnaW4tYm90dG9tOjEwcHg7fS5tZXRhe2NvbG9yOnZhcigtLW11dGVkKTtmb250LXNpemU6MTJweDttYXJnaW4tYm90dG9tOjQwcHg7fWgye2ZvbnQtc2l6ZToxOHB4O21hcmdpbi10b3A6MzJweDttYXJnaW4tYm90dG9tOjE0cHg7Y29sb3I6dmFyKC0tYWNjZW50KTt9cHttYXJnaW4tYm90dG9tOjEycHg7fWF7Y29sb3I6dmFyKC0tYWNjZW50KTt9Zm9vdGVye2JvcmRlci10b3A6MXB4IHNvbGlkICMzMzM7cGFkZGluZy10b3A6MjBweDttYXJnaW4tdG9wOjYwcHg7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6dmFyKC0tbXV0ZWQpO2ZvbnQtc2l6ZToxMXB4O308L3N0eWxlPjwvaGVhZD48Ym9keT48ZGl2IGNsYXNzPSJjb250YWluZXIiPjxoMT5Uw4lSTUlOT1MgWSBDT05ESUNJT05FUzwvaDE+PGRpdiBjbGFzcz0ibWV0YSI+w5psdGltYSBhY3R1YWxpemFjacOzbjogMTAgZGUgYWdvc3RvIGRlIDIwMjY8L2Rpdj48aDI+MS4gUVVJw4lORVMgU09NT1MgWSBBQ0VQVEFDScOTTjwvaDI+PHA+QXRpw6luZGVtZSBsYSBQeW1lICgibm9zb3Ryb3MiLCAiZWwgcHJvdmVlZG9yIikgb2ZyZWNlIGFnZW50ZXMgZGUgaW50ZWxpZ2VuY2lhIGFydGlmaWNpYWwgKGNoYXQgeSB2b3opIHBhcmEgYXV0b21hdGl6YXIgbGEgYXRlbmNpw7NuIGFsIGNsaWVudGUsIHZlbnRhcyB5IGFnZW5kYW1pZW50byBkZSBjaXRhcyBkZSBwZXF1ZcOxYXMgeSBtZWRpYW5hcyBlbXByZXNhcyBlbiBDaGlsZSwgYSB0cmF2w6lzIGRlIGNhbmFsZXMgY29tbyBzaXRpbyB3ZWIsIFdoYXRzQXBwLCBJbnN0YWdyYW0sIEZhY2Vib29rIE1lc3NlbmdlciB5IGNvcnJlbyBlbGVjdHLDs25pY28uIEFsIGNvbnRyYXRhciBudWVzdHJvcyBzZXJ2aWNpb3MgbyB1c2FyIGVzdGUgc2l0aW8sIHVzdGVkIGFjZXB0YSBlc3RvcyBUw6lybWlub3MgeSBDb25kaWNpb25lcy4gU2kgbm8gZXN0w6EgZGUgYWN1ZXJkbywgbm8gZGViZSB1c2FyIGVsIHNlcnZpY2lvLjwvcD48aDI+Mi4gTkFUVVJBTEVaQSBERUwgU0VSVklDSU88L2gyPjxwPkVsIHNlcnZpY2lvIGNvbnNpc3RlIGVuIGxhIGNvbmZpZ3VyYWNpw7NuLCBlbnRyZW5hbWllbnRvIGUgaW1wbGVtZW50YWNpw7NuIGRlIGFzaXN0ZW50ZXMgZGUgaW50ZWxpZ2VuY2lhIGFydGlmaWNpYWwgcXVlIHJlc3BvbmRlbiBjb25zdWx0YXMsIGNhbGlmaWNhbiBsZWFkcyB5IGFnZW5kYW4gY2l0YXMgZW4gbm9tYnJlIGRlbCBjbGllbnRlIGNvbnRyYXRhbnRlICgiZWwgQ2xpZW50ZSIpLCBzZWfDum4gZWwgcGxhbiBjb250cmF0YWRvLiBMYXMgcmVzcHVlc3RhcyBkZWwgYXNpc3RlbnRlIGRlIElBIHNlIGdlbmVyYW4gZGUgZm9ybWEgYXV0b21hdGl6YWRhIHkgcHVlZGVuIHJlcXVlcmlyIHN1cGVydmlzacOzbiBodW1hbmE7IG5vIGdhcmFudGl6YW1vcyBleGFjdGl0dWQgYWJzb2x1dGEgZW4gY2FkYSBpbnRlcmFjY2nDs24uPC9wPjxoMj4zLiBQTEFORVMsIFBSRUNJT1MgWSBGT1JNQSBERSBQQUdPPC9oMj48cD5Mb3MgcHJlY2lvcyBwdWJsaWNhZG9zIGVuIGVsIHNpdGlvIHNvbiBlbiBwZXNvcyBjaGlsZW5vcyAoQ0xQKSwgaW5jbHV5ZW4gbyBleGNsdXllbiBJVkEgc2Vnw7puIHNlIGluZGlxdWUsIHkgZXN0w6FuIHN1amV0b3MgYSBjYW1iaW8gc2luIHByZXZpbyBhdmlzbyBwYXJhIG51ZXZvcyBjb250cmF0b3MgKG5vIGFmZWN0YW4gY29udHJhdG9zIHZpZ2VudGVzKS4gRWwgcGFnbyDDum5pY28gY3VicmUgbGEgY29uZmlndXJhY2nDs24gaW5pY2lhbDsgZWwgY29icm8gbWVuc3VhbCBjdWJyZSBtYW50ZW5jacOzbiwgaG9zdGluZyB5IHVzbyBjb250aW51byBkZSBsYSBwbGF0YWZvcm1hLiBMYSBmYWx0YSBkZSBwYWdvIHB1ZWRlIHJlc3VsdGFyIGVuIGxhIHN1c3BlbnNpw7NuIGRlbCBzZXJ2aWNpbywgcHJldmlvIGF2aXNvIGFsIGNvcnJlbyBkZSBjb250YWN0byBkZWwgQ2xpZW50ZS48L3A+PGgyPjQuIERVUkFDScOTTiBZIFTDiVJNSU5PPC9oMj48cD5FbCBzZXJ2aWNpbyBubyBleGlnZSBjb250cmF0b3MgZGUgcGVybWFuZW5jaWEgbcOtbmltYSBmb3J6b3NhLiBFbCBDbGllbnRlIHB1ZWRlIHNvbGljaXRhciBsYSBjYW5jZWxhY2nDs24gZW4gY3VhbHF1aWVyIG1vbWVudG8sIHNpbiBwZW5hbGl6YWNpw7NuLCBtZWRpYW50ZSBjb211bmljYWNpw7NuIGVzY3JpdGEgYSBob2xhQGF0aWVuZGVtZWxhcHltZS5jbC4gTGEgY2FuY2VsYWNpw7NuIGFwbGljYSBhbCBjaWNsbyBkZSBmYWN0dXJhY2nDs24gc2lndWllbnRlIGFsIGF2aXNvOyBubyBzZSByZWFsaXphbiBkZXZvbHVjaW9uZXMgcHJvcG9yY2lvbmFsZXMgZGUgbWVuc3VhbGlkYWRlcyB5YSBmYWN0dXJhZGFzLCBzYWx2byBxdWUgbGEgbGV5IGNoaWxlbmEgZGlzcG9uZ2EgbG8gY29udHJhcmlvLjwvcD48aDI+NS4gT0JMSUdBQ0lPTkVTIERFTCBDTElFTlRFPC9oMj48cD5FbCBDbGllbnRlIGVzIHJlc3BvbnNhYmxlIGRlOiAoYSkgZW50cmVnYXIgaW5mb3JtYWNpw7NuIHZlcmF6IHNvYnJlIHN1IG5lZ29jaW8gcGFyYSBlbCBlbnRyZW5hbWllbnRvIGRlbCBhc2lzdGVudGU7IChiKSBjb250YXIgY29uIGxhcyBjdWVudGFzIHkgcGVybWlzb3MgbmVjZXNhcmlvcyBlbiBXaGF0c0FwcCBCdXNpbmVzcywgSW5zdGFncmFtLCBGYWNlYm9vayB1IG90cm9zIGNhbmFsZXMgcXVlIGRlc2VlIGludGVncmFyOyAoYykgc3VwZXJ2aXNhciByYXpvbmFibGVtZW50ZSBsYXMgaW50ZXJhY2Npb25lcyBhdXRvbWF0aXphZGFzIGNvbiBzdXMgcHJvcGlvcyBjbGllbnRlcyBmaW5hbGVzOyB5IChkKSBjdW1wbGlyIGNvbiBsYSBub3JtYXRpdmEgYXBsaWNhYmxlIGEgc3UgcnVicm8gKHBvciBlamVtcGxvLCBzaSBvcGVyYSBlbiBzYWx1ZCwgcmV0YWlsIHJlZ3VsYWRvIHUgb3Ryb3Mgc2VjdG9yZXMgY29uIHJlcXVpc2l0b3MgZXNwZWPDrWZpY29zKS48L3A+PGgyPjYuIExJTUlUQUNJw5NOIERFIFJFU1BPTlNBQklMSURBRDwvaDI+PHA+RWwgc2VydmljaW8gc2UgZW50cmVnYSAidGFsIGN1YWwiICgiYXMgaXMiKSwgc2luIGdhcmFudMOtYXMgZGUgZGlzcG9uaWJpbGlkYWQgaW5pbnRlcnJ1bXBpZGEuIE5vIG5vcyBoYWNlbW9zIHJlc3BvbnNhYmxlcyBwb3I6IChhKSBkZWNpc2lvbmVzIGNvbWVyY2lhbGVzIHRvbWFkYXMgcG9yIGVsIENsaWVudGUgZW4gYmFzZSBhIGxhcyBpbnRlcmFjY2lvbmVzIGRlbCBhc2lzdGVudGUgZGUgSUE7IChiKSBww6lyZGlkYXMgZGVyaXZhZGFzIGRlIGZhbGxhcyBkZSB0ZXJjZXJvcyAoV2hhdHNBcHAsIE1ldGEsIEdvb2dsZSwgcHJvdmVlZG9yZXMgZGUgaG9zdGluZyBvIGRlIG1vZGVsb3MgZGUgSUEpOyBvIChjKSBjb250ZW5pZG8gZ2VuZXJhZG8gcG9yIGVsIGFzaXN0ZW50ZSBxdWUgc2UgZGVzdsOtZSBkZSBsYSBpbmZvcm1hY2nDs24gcHJvcG9yY2lvbmFkYSBwb3IgZWwgQ2xpZW50ZSBwYXJhIHN1IGVudHJlbmFtaWVudG8sIGVuIGxhIG1lZGlkYSBwZXJtaXRpZGEgcG9yIGxhIGxleSBjaGlsZW5hLiBOYWRhIGVuIGVzdGEgY2zDoXVzdWxhIGxpbWl0YSByZXNwb25zYWJpbGlkYWRlcyBxdWUsIGNvbmZvcm1lIGEgbGEgTGV5IE4uwrAgMTkuNDk2IHNvYnJlIFByb3RlY2Npw7NuIGRlIGxvcyBEZXJlY2hvcyBkZSBsb3MgQ29uc3VtaWRvcmVzLCBubyBwdWVkYW4gcmVudW5jaWFyc2UgYW50aWNpcGFkYW1lbnRlLjwvcD48aDI+Ny4gUFJPVEVDQ0nDk04gREUgREFUT1MgUEVSU09OQUxFUzwvaDI+PHA+RWwgdHJhdGFtaWVudG8gZGUgZGF0b3MgcGVyc29uYWxlcyBkZSBsb3MgdXN1YXJpb3MgZmluYWxlcyBxdWUgaW50ZXJhY3TDumFuIGNvbiBsb3MgYXNpc3RlbnRlcyBkZSBJQSBzZSByaWdlIHBvciBudWVzdHJhIDxhIGhyZWY9Ii9wcml2YWNpZGFkIj5Qb2zDrXRpY2EgZGUgUHJpdmFjaWRhZDwvYT4sIGVsYWJvcmFkYSBjb25mb3JtZSBhIGxhIExleSBOLsKwIDE5LjYyOCBzb2JyZSBQcm90ZWNjacOzbiBkZSBsYSBWaWRhIFByaXZhZGEgeSwgZW4gbG8gcXVlIGNvcnJlc3BvbmRhIHNlZ8O6biBzdSBlbnRyYWRhIGVuIHZpZ2VuY2lhLCBsYSBMZXkgTi7CsCAyMS43MTkgcXVlIFJlZ3VsYSBsYSBQcm90ZWNjacOzbiB5IGVsIFRyYXRhbWllbnRvIGRlIGxvcyBEYXRvcyBQZXJzb25hbGVzIHkgY3JlYSBsYSBBZ2VuY2lhIGRlIFByb3RlY2Npw7NuIGRlIERhdG9zIFBlcnNvbmFsZXMuIEVsIENsaWVudGUsIGNvbW8gcmVzcG9uc2FibGUgZGUgbG9zIGRhdG9zIGRlIHN1cyBwcm9waW9zIGNsaWVudGVzIGZpbmFsZXMsIGRlYmUgYXNlZ3VyYXJzZSBkZSBjb250YXIgY29uIGxhcyBiYXNlcyBkZSBsaWNpdHVkIGNvcnJlc3BvbmRpZW50ZXMgcGFyYSBlbCB0cmF0YW1pZW50byBkZSBkaWNob3MgZGF0b3MgYSB0cmF2w6lzIGRlIG51ZXN0cm9zIHNlcnZpY2lvcy48L3A+PGgyPjguIERFUkVDSE9TIERFTCBDT05TVU1JRE9SIChMRVkgTi7CsCAxOS40OTYpPC9oMj48cD5Db25mb3JtZSBhIGxhIExleSBOLsKwIDE5LjQ5NiBzb2JyZSBQcm90ZWNjacOzbiBkZSBsb3MgRGVyZWNob3MgZGUgbG9zIENvbnN1bWlkb3JlcywgZWwgQ2xpZW50ZSB0aWVuZSBkZXJlY2hvIGE6IChhKSBpbmZvcm1hY2nDs24gdmVyYXogeSBvcG9ydHVuYSBzb2JyZSBsYXMgY29uZGljaW9uZXMgZGVsIHNlcnZpY2lvOyAoYikgbm8gc2VyIGRpc2NyaW1pbmFkbyBhcmJpdHJhcmlhbWVudGUgcG9yIHByb3ZlZWRvcmVzIGRlIGJpZW5lcyB5IHNlcnZpY2lvczsgKGMpIGxhIHJlcGFyYWNpw7NuIGUgaW5kZW1uaXphY2nDs24gYWRlY3VhZGEgcG9yIHRvZG9zIGxvcyBkYcOxb3MgbWF0ZXJpYWxlcyB5IG1vcmFsZXMgZW4gY2FzbyBkZSBpbmN1bXBsaW1pZW50bzsgeSAoZCkgcmV0cmFjdG8geSBvdHJvcyBkZXJlY2hvcyBxdWUgbGEgbGV5IGVzdGFibGV6Y2Egc2Vnw7puIGNvcnJlc3BvbmRhIGEgbGEgbW9kYWxpZGFkIGRlIGNvbnRyYXRhY2nDs24uIEFudGUgY3VhbHF1aWVyIGNvbnRyb3ZlcnNpYSwgZWwgQ2xpZW50ZSBwdWVkZSByZWN1cnJpciBhbCBTZXJ2aWNpbyBOYWNpb25hbCBkZWwgQ29uc3VtaWRvciAoU0VSTkFDKS48L3A+PGgyPjkuIENPTlRSQVRBQ0nDk04gRUxFQ1RSw5NOSUNBIFkgVkFMSURFWiBERSBDT01VTklDQUNJT05FUzwvaDI+PHA+TGFzIGNvbXVuaWNhY2lvbmVzLCBhY2VwdGFjaW9uZXMgeSBjb25maXJtYWNpb25lcyByZWFsaXphZGFzIHBvciBjb3JyZW8gZWxlY3Ryw7NuaWNvIG8gYSB0cmF2w6lzIGRlIG51ZXN0cm8gc2l0aW8gd2ViIHRpZW5lbiB2YWxvciBjb25mb3JtZSBhIGxhIExleSBOLsKwIDE5Ljc5OSBzb2JyZSBEb2N1bWVudG9zIEVsZWN0csOzbmljb3MsIEZpcm1hIEVsZWN0csOzbmljYSB5IFNlcnZpY2lvcyBkZSBDZXJ0aWZpY2FjacOzbiBkZSBkaWNoYSBGaXJtYSwgZW4gbG8gcXVlIHJlc3VsdGUgYXBsaWNhYmxlIGEgbGEgbmF0dXJhbGV6YSBkZSBlc3RlIHNlcnZpY2lvLjwvcD48aDI+MTAuIFBST1BJRURBRCBJTlRFTEVDVFVBTDwvaDI+PHA+RWwgc29mdHdhcmUsIGxhIHBsYXRhZm9ybWEsIGVsIGRpc2XDsW8gZGVsIHNpdGlvIHkgbGEgdGVjbm9sb2fDrWEgc3VieWFjZW50ZSBzb24gZGUgcHJvcGllZGFkIGRlIEF0acOpbmRlbWUgbGEgUHltZSBvIGRlIHN1cyBsaWNlbmNpYW50ZXMsIHkgZXN0w6FuIHByb3RlZ2lkb3MgY29uZm9ybWUgYSBsYSBMZXkgTi7CsCAxNy4zMzYgc29icmUgUHJvcGllZGFkIEludGVsZWN0dWFsLiBMYSBpbmZvcm1hY2nDs24geSBjb250ZW5pZG9zIHF1ZSBlbCBDbGllbnRlIGVudHJlZ2EgcGFyYSBlbnRyZW5hciBzdSBhc2lzdGVudGUgKHRleHRvcywgcHJlY2lvcywgaG9yYXJpb3MsIG1hcmNhKSBwZXJtYW5lY2VuIGRlIHByb3BpZWRhZCBkZWwgQ2xpZW50ZTsgZWwgQ2xpZW50ZSBub3Mgb3RvcmdhIHVuYSBsaWNlbmNpYSBsaW1pdGFkYSBwYXJhIHVzYXJsb3Mgw7puaWNhbWVudGUgY29uIGVsIGZpbiBkZSBvcGVyYXIgc3UgYXNpc3RlbnRlIGRlIElBLjwvcD48aDI+MTEuIFVTTyBBQ0VQVEFCTEU8L2gyPjxwPkVsIENsaWVudGUgbm8gZGViZSB1dGlsaXphciBlbCBzZXJ2aWNpbyBwYXJhIGZpbmVzIGlsw61jaXRvcywgcGFyYSBkaWZ1bmRpciBjb250ZW5pZG8gcXVlIGluZnJpbmphIGRlcmVjaG9zIGRlIHRlcmNlcm9zLCBuaSBwYXJhIGFjdGl2aWRhZGVzIGNvbnRyYXJpYXMgYWwgb3JkZW4gcMO6YmxpY28gbyBsYXMgYnVlbmFzIGNvc3R1bWJyZXMuIE5vcyByZXNlcnZhbW9zIGVsIGRlcmVjaG8gZGUgc3VzcGVuZGVyIGVsIHNlcnZpY2lvIGFudGUgdW4gdXNvIHF1ZSBpbmN1bXBsYSBlc3RhIGNsw6F1c3VsYSwgcHJldmlhIG5vdGlmaWNhY2nDs24gY3VhbmRvIHNlYSByYXpvbmFibGVtZW50ZSBwb3NpYmxlLjwvcD48aDI+MTIuIE1PRElGSUNBQ0lPTkVTIEEgRVNUT1MgVMOJUk1JTk9TPC9oMj48cD5Qb2RlbW9zIGFjdHVhbGl6YXIgZXN0b3MgVMOpcm1pbm9zIHkgQ29uZGljaW9uZXMgb2Nhc2lvbmFsbWVudGUuIExvcyBjYW1iaW9zIHN1c3RhbmNpYWxlcyBzZXLDoW4gbm90aWZpY2Fkb3MgYSBsb3MgQ2xpZW50ZXMgYWN0aXZvcyBwb3IgY29ycmVvIGVsZWN0csOzbmljby4gTGEgZmVjaGEgZGUgIsOabHRpbWEgYWN0dWFsaXphY2nDs24iIHJlZmxlamEgbGEgdmVyc2nDs24gdmlnZW50ZS4gRWwgdXNvIGNvbnRpbnVhZG8gZGVsIHNlcnZpY2lvIHRyYXMgdW5hIGFjdHVhbGl6YWNpw7NuIGNvbnN0aXR1eWUgYWNlcHRhY2nDs24gZGUgbG9zIG51ZXZvcyB0w6lybWlub3MuPC9wPjxoMj4xMy4gTEVZIEFQTElDQUJMRSBZIEpVUklTRElDQ0nDk048L2gyPjxwPkVzdG9zIFTDqXJtaW5vcyB5IENvbmRpY2lvbmVzIHNlIHJpZ2VuIHBvciBsYXMgbGV5ZXMgZGUgbGEgUmVww7pibGljYSBkZSBDaGlsZS4gQ3VhbHF1aWVyIGNvbnRyb3ZlcnNpYSBkZXJpdmFkYSBkZSBlc3RvcyB0w6lybWlub3MgcXVlIG5vIHB1ZWRhIHJlc29sdmVyc2UgZGUgZm9ybWEgZGlyZWN0YSBlbnRyZSBsYXMgcGFydGVzLCBvIGEgdHJhdsOpcyBkZSBTRVJOQUMgZW4gZWwgY2FzbyBkZSBjb25zdW1pZG9yZXMsIHNlcsOhIHNvbWV0aWRhIGEgbG9zIHRyaWJ1bmFsZXMgb3JkaW5hcmlvcyBkZSBqdXN0aWNpYSBjb24gYXNpZW50byBlbiBTYW50aWFnbyBkZSBDaGlsZSwgc2luIHBlcmp1aWNpbyBkZSBsYXMgbm9ybWFzIGRlIGNvbXBldGVuY2lhIHF1ZSBsYSBsZXkgZXN0YWJsZXpjYSBlbiBmYXZvciBkZWwgY29uc3VtaWRvci48L3A+PGgyPjE0LiBDT05UQUNUTzwvaDI+PHA+U2kgdGllbmVzIHByZWd1bnRhcyBzb2JyZSBlc3RvcyBUw6lybWlub3MgeSBDb25kaWNpb25lczogPHN0cm9uZz5ob2xhQGF0aWVuZGVtZWxhcHltZS5jbDwvc3Ryb25nPjwvcD48Zm9vdGVyPsKpIDIwMjYgQXRpw6luZGVtZSBsYSBQeW1lIOKAlCBDdW1wbGltaWVudG8gY29uIGxhIGxlZ2lzbGFjacOzbiBkZSBsYSBSZXDDumJsaWNhIGRlIENoaWxlPC9mb290ZXI+PC9kaXY+PC9ib2R5PjwvaHRtbD4="

def main():
    path = "src/index.js"
    with open(path, encoding="utf-8") as f:
        src = f.read()

    terms_body = base64.b64decode(TERMS_B64).decode("utf-8")
    changes = []

    marker1 = "const PRIVACY_POLICY = "
    if "const TERMS_OF_SERVICE = " not in src:
        if marker1 not in src:
            print("ERROR: no se encontro \'const PRIVACY_POLICY = \' -- abortando sin tocar el archivo")
            sys.exit(1)
        idx = src.index(marker1)
        js_const = "const TERMS_OF_SERVICE = `" + terms_body + "`;\n\n"
        src = src[:idx] + js_const + src[idx:]
        changes.append("constante TERMS_OF_SERVICE insertada")
    else:
        changes.append("TERMS_OF_SERVICE ya existia (sin cambios)")

    old_route = ("            if (pathname === '/privacidad' || pathname === '/privacidad/') {\n"
                 "                return new Response(PRIVACY_POLICY, {\n"
                 "                    status: 200,\n"
                 "                    headers: { 'Content-Type': 'text/html; charset=utf-8' }\n"
                 "                });\n"
                 "            }")
    new_route = old_route + ("\n            if (pathname === '/terminos' || pathname === '/terminos/') {\n"
                 "                return new Response(TERMS_OF_SERVICE, {\n"
                 "                    status: 200,\n"
                 "                    headers: { 'Content-Type': 'text/html; charset=utf-8' }\n"
                 "                });\n"
                 "            }")
    if "pathname === '/terminos'" not in src:
        if old_route not in src:
            print("ERROR: no se encontro el bloque de ruta /privacidad -- abortando sin tocar el archivo")
            sys.exit(1)
        src = src.replace(old_route, new_route, 1)
        changes.append("ruta /terminos agregada al router")
    else:
        changes.append("ruta /terminos ya existia (sin cambios)")

    old_footer = '<a href=\\"#\\">T\u00e9rminos</a>'
    new_footer = '<a href=\\"/terminos\\">T\u00e9rminos</a>'
    if old_footer in src:
        src = src.replace(old_footer, new_footer, 1)
        changes.append("link del footer actualizado (# -> /terminos)")
    elif new_footer in src:
        changes.append("link del footer ya estaba actualizado (sin cambios)")
    else:
        print("ADVERTENCIA: no se encontro el link del footer esperado -- revisar manualmente")

    old_sitemap = ("  <url>\n"
                   "    <loc>https://atiendemelapyme.cl/privacidad</loc>\n"
                   "    <lastmod>2026-07-22</lastmod>\n"
                   "    <changefreq>yearly</changefreq>\n"
                   "    <priority>0.3</priority>\n"
                   "  </url>\n"
                   "</urlset>")
    new_sitemap = ("  <url>\n"
                   "    <loc>https://atiendemelapyme.cl/privacidad</loc>\n"
                   "    <lastmod>2026-07-22</lastmod>\n"
                   "    <changefreq>yearly</changefreq>\n"
                   "    <priority>0.3</priority>\n"
                   "  </url>\n"
                   "  <url>\n"
                   "    <loc>https://atiendemelapyme.cl/terminos</loc>\n"
                   "    <lastmod>2026-08-10</lastmod>\n"
                   "    <changefreq>yearly</changefreq>\n"
                   "    <priority>0.3</priority>\n"
                   "  </url>\n"
                   "</urlset>")
    if "atiendemelapyme.cl/terminos</loc>" not in src:
        if old_sitemap in src:
            src = src.replace(old_sitemap, new_sitemap, 1)
            changes.append("sitemap.xml actualizado")
        else:
            print("ADVERTENCIA: no se encontro el bloque de sitemap esperado -- revisar manualmente")
    else:
        changes.append("sitemap ya tenia /terminos (sin cambios)")

    old_llms = ("- [Pol\u00edtica de privacidad](https://atiendemelapyme.cl/privacidad): "
                "tratamiento de datos conforme a la Ley N.\u00b0 19.628 de Chile.")
    new_llms = old_llms + ("\n- [T\u00e9rminos y condiciones](https://atiendemelapyme.cl/terminos): "
                "condiciones del servicio, precios, cancelaci\u00f3n y ley aplicable en Chile.")
    if "atiendemelapyme.cl/terminos):" not in src:
        if old_llms in src:
            src = src.replace(old_llms, new_llms, 1)
            changes.append("llms.txt actualizado")
        else:
            print("ADVERTENCIA: no se encontro la linea de privacidad en llms.txt -- revisar manualmente")
    else:
        changes.append("llms.txt ya tenia /terminos (sin cambios)")

    with open(path, "w", encoding="utf-8") as f:
        f.write(src)

    print("Listo. Cambios aplicados:")
    for c in changes:
        print(" -", c)

if __name__ == "__main__":
    main()
