/**
 * External dependencies
 */
import { useDispatch } from '@wordpress/data';
import { ITEMS_STORE_NAME } from '@woocommerce/data';
import { getAdminLink } from '@woocommerce/settings';
import { getNewPath, navigateTo } from '@woocommerce/navigation';
import { loadExperimentAssignment } from '@woocommerce/explat';
import moment from 'moment';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ProductTypeKey } from './constants';
import { createNoticesFromResponse } from '../../../lib/notices';

export const useCreateProductByType = () => {
	const { createProductFromTemplate } = useDispatch( ITEMS_STORE_NAME );
	const [ isRequesting, setIsRequesting ] = useState< boolean >( false );

	const createProductByType = async ( type: ProductTypeKey ) => {
		if ( type === 'subscription' ) {
			window.location.href = getAdminLink(
				'post-new.php?post_type=product&subscription_pointers=true'
			);
			return;
		}

		setIsRequesting( true );

		if ( type === 'physical' ) {
			const momentDate = moment().utc();
			const year = momentDate.format( 'YYYY' );
			const month = momentDate.format( 'MM' );
			const assignment = await loadExperimentAssignment(
				`woocommerce_product_creation_experience_${ year }${ month }_v1`
			);

			if ( assignment.variationName === 'treatment' ) {
				navigateTo( { url: getNewPath( {}, '/add-product', {} ) } );
				return;
			}
		}

		try {
			const data: {
				id?: number;
			} = await createProductFromTemplate(
				{
					template_name: type,
					status: 'draft',
				},
				{ _fields: [ 'id' ] }
			);
			if ( data && data.id ) {
				const link = getAdminLink(
					`post.php?post=${ data.id }&action=edit&wc_onboarding_active_task=products&tutorial=true`
				);
				window.location.href = link;
			} else {
				throw new Error( 'Unexpected empty data response from server' );
			}
		} catch ( error ) {
			createNoticesFromResponse( error );
		}
		setIsRequesting( false );
	};

	return {
		createProductByType,
		isRequesting,
	};
};
