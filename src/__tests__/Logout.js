/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import Logout from "../containers/Logout.js"
import '@testing-library/jest-dom/extend-expect'
import { localStorageMock } from "../__mocks__/localStorage.js"
import DashboardUI from "../views/DashboardUI.js"
import userEvent from '@testing-library/user-event'
import { ROUTES } from "../constants/routes"

const bills = [{
  "id": "47qAXb6fIm2zOKkLzMro",
  "vat": "80",
  "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
  "status": "pending",
  "type": "Hôtel et logement",
  "commentary": "séminaire billed",
  "name": "encore",
  "fileName": "preview-facture-free-201801-pdf-1.jpg",
  "date": "2004-04-04",
  "amount": 400,
  "commentAdmin": "ok",
  "email": "a@a",
  "pct": 20,
}]

describe('Given I am connected', () => {
  describe('When I click on disconnect button as Admin', () => {
    test(('Then, I should be sent to login page'), () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Admin'
      }))
      document.body.innerHTML = DashboardUI({ bills })
      const logout = new Logout({ document, onNavigate, localStorage })
      const handleClick = jest.fn(logout.handleClick)

      const disco = screen.getByTestId('layout-disconnect')
      disco.addEventListener('click', handleClick)
      userEvent.click(disco)
      expect(handleClick).toHaveBeenCalled()
      expect(screen.getByText('Administration')).toBeTruthy()
    })
  })

  describe('When I click on disconnect button as Employee', () => {
    test(('Then, I should be sent to login page'), () => {
      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      })
      
      // Setup as Employee with properly mocked localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true
      })
      
      // Use BillsUI instead of DashboardUI for employee view
      const html = `
        <div>
          <div data-testid="layout-disconnect"></div>
        </div>
      `
      document.body.innerHTML = html
      
      const logout = new Logout({
        document,
        onNavigate,
        localStorage: window.localStorage
      })
      
      const handleClick = jest.fn(logout.handleClick)
      const disco = screen.getByTestId('layout-disconnect')
      disco.addEventListener('click', handleClick)
      userEvent.click(disco)
      
      // Check if logout handler was called
      expect(handleClick).toHaveBeenCalled()
      
      // Check if localStorage was cleared
      expect(window.localStorage.clear).toHaveBeenCalled()
      
      // Check if we were redirected to login page
      expect(onNavigate).toHaveBeenCalledWith('/')
    })
  })
})
